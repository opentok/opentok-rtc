// This file implements the API described in api.yml

// Note: Since we're not putting the TB key and data here, and don't really want
// to have a not-checked-in file for that either, we're just going to store them
// on redis (and they should be already stored when this runs).
// Just run:
// redis-cli set tb_api_key yourkeyhere
// redis-cli set tb_api_secret yoursecrethere
// Once before trying to run this.
// The second argument is only really needed for the unit tests.

'use strict';

var SwaggerBP = require('swagger-boilerplate');
var helmet = require('helmet');
var C = require('./serverConstants');
var configLoader = require('./configLoader');
var ArchiveLocalStorage = require('./archiveLocalStorage');
var GoogleAuth = require('./googleAuthStrategies');
var testHealth = require('./testHealth');
var Haikunator = require('haikunator');
var _ = require('lodash');
var qs = require('qs');
var accepts = require('accepts');
var geoip = require('geoip-lite');

function htmlEscape(str) {
  return String(str)
    .replace(/&/g, '')
    .replace(/"/g, '')
    .replace(/'/g, '')
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/\(/g, '')
    .replace(/\)/g, '')
    .replace(/'/g, '')
    .replace(/\\/g, '')
    .replace(/;/g, '');
};

function getUserLanguage(acceptedLanguages) {
  let language = '';

  if (acceptedLanguages && acceptedLanguages[0]) {
    language = acceptedLanguages[0];

    if (language.indexOf('-') !== -1) {
      language = language.split('-')[0];
    } else if (language.indexOf('_') !== -1) {
      language = language.split('_')[0];
    }
  }

  return language;
}

function getUserCountry(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};

  return _.get(geo, 'country', '').toLowerCase();
}

var securityHeaders = helmet({
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  contentSecurityPolicy: false,
  frameGuard: false, // configured by tbConfig.allowIframing
});

function ServerMethods(aLogLevel, aModules) {
  aModules = aModules || {};

  var ErrorInfo = SwaggerBP.ErrorInfo;

  var env = process.env;
  var Utils = SwaggerBP.Utils;

  var Logger = Utils.MultiLevelLogger;
  var promisify = Utils.promisify;

  var Opentok = aModules.Opentok || require('opentok');  // eslint-disable-line global-require

  var roomBlackList;

  var logger = new Logger('ServerMethods', aLogLevel);
  var ServerPersistence = SwaggerBP.ServerPersistence;
  var connectionString =
    (aModules && aModules.params && aModules.params.persistenceConfig) ||
    env.REDIS_URL || env.REDISTOGO_URL || '';
  var serverPersistence =
    new ServerPersistence([], connectionString, aLogLevel, aModules);

  const haikunator = new Haikunator();

  const redisRoomPrefix = C.REDIS_ROOM_PREFIX;
  const redisPhonePrefix = C.REDIS_PHONE_PREFIX;

  var sipUri;
  var googleAuth;
  // Opentok API instance, which will be configured only after tbConfigPromise
  // is resolved
  var tbConfigPromise;

  // Initiates polling from the Opentok servers for changes on the status of an archive.
  // This is a *very* specific polling since we expect the archive will have already been stopped
  // by the time this launches and we're just waiting for it to be available or uploaded.
  // To try to balance not polling to often with trying to get a result fast, the polling time
  // increases exponentially (on the theory that if the archive is small it'll be copied fast
  // and if it's big we don't want to look too impatient).
  function _launchArchivePolling(aOtInstance, aArchiveId, aTimeout, aTimeoutMultiplier) {
    return new Promise((resolve) => {
      var timeout = aTimeout;
      var pollArchive = function _pollArchive() {
        logger.log('Poll [', aArchiveId, ']: polling...');
        aOtInstance.getArchive_P(aArchiveId).then((aArchive) => {
          if (aArchive.status === 'available' || aArchive.status === 'uploaded') {
            logger.log('Poll [', aArchiveId, ']: Resolving with', aArchive.status);
            resolve(aArchive);
          } else {
            timeout *= aTimeoutMultiplier;
            logger.log('Poll [', aArchiveId, ']: Retrying in', timeout);
            setTimeout(_pollArchive, timeout);
          }
        });
      };
      logger.log('Poll [', aArchiveId, ']: Setting first try for', timeout);
      setTimeout(pollArchive, timeout);
    });
  }

  function _shutdownOldInstance(aOldPromise, aNewPromise) {
    aOldPromise && (aNewPromise !== aOldPromise) &&
      aOldPromise.then(aObject => aObject.shutdown());
  }


  function _initialTBConfig() {
    return configLoader.readConfigJson().then((config) => {
              // This will hold the configuration read from Redis
      var defaultTemplate = config.get(C.DEFAULT_TEMPLATE);
      var templatingSecret = config.get(C.TEMPLATING_SECRET);
      var apiKey = config.get(C.OPENTOK_API_KEY);
      var apiSecret = config.get(C.OPENTOK_API_SECRET);
      var precallApiKey = config.get(C.OPENTOK_PRECALL_API_KEY) || config.get(C.OPENTOK_API_KEY);
      var precallApiSecret = config.get(C.OPENTOK_PRECALL_API_SECRET)
        || config.get(C.OPENTOK_API_SECRET);
      var opentokJsUrl = config.get(C.OPENTOK_JS_URL);
      var useGoogleFonts = config.get(C.USE_GOOGLE_FONTS);
      var jqueryUrl = config.get(C.JQUERY_URL);
      logger.log('apiSecret', apiSecret);
      var archivePollingTO = config.get(C.ARCHIVE_POLLING_INITIAL_TIMEOUT);
      var archivePollingTOMultiplier =
                config.get(C.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER);
      var otInstance = Utils.CachifiedObject(Opentok, apiKey, apiSecret);
      var precallOtInstance = Utils.CachifiedObject(Opentok, precallApiKey, precallApiSecret);

      var allowIframing = config.get(C.ALLOW_IFRAMING);
      var archiveAlways = config.get(C.ARCHIVE_ALWAYS);

      var iosAppId = config.get(C.IOS_APP_ID);
      var iosUrlPrefix = config.get(C.IOS_URL_PREFIX);

      var enableSip = config.get(C.SIP_ENABLED);
      var sipUsername = config.get(C.SIP_USERNAME);
      var sipPassword = config.get(C.SIP_PASSWORD);
      var sipRequireGoogleAuth = config.get(C.SIP_REQUIRE_GOOGLE_AUTH);
      var googleId = config.get(C.GOOGLE_CLIENT_ID);
      var googleHostedDomain = config.get(C.GOOGLE_HOSTED_DOMAIN);
      var mediaMode = config.get(C.MEDIA_MODE);

      if (sipRequireGoogleAuth) {
        googleAuth = new GoogleAuth.EnabledGoogleAuthStrategy(googleId, googleHostedDomain);
      } else {
        googleAuth = new GoogleAuth.DisabledGoogleAuthStategy();
      }
      // This isn't strictly necessary... but since we're using promises all over the place, it
      // makes sense. The _P are just a promisified version of the methods. We could have
      // overwritten the original methods but this way we make it explicit. That's also why we're
      // breaking camelCase here, to make it patent to the reader that those aren't standard
      // methods of the API.
      ['startArchive', 'stopArchive', 'getArchive', 'listArchives', 'deleteArchive', 'dial',
        'forceDisconnect']
        .forEach(method => otInstance[method + '_P'] = promisify(otInstance[method])); // eslint-disable-line no-return-assign

      var maxSessionAge = config.get(C.OPENTOK_MAX_SESSION_AGE);
      var maxSessionAgeMs = maxSessionAge * 24 * 60 * 60 * 1000;
      var chromeExtId = config.get(C.CHROME_EXTENSION_ID);

      var isWebRTCVersion = config.get(C.DEFAULT_INDEX_PAGE) === 'opentokrtc';
      var showTos = config.get(C.SHOW_TOS);
      var meetingsRatePerMinute = config.get(C.MEETINGS_RATE_PER_MINUTE);
      var minMeetingNameLength = config.get(C.MIN_MEETING_NAME_LENGTH);
      var publisherResolution = config.get(C.PUBLISHER_RESOLUTION);
      var supportIE = config.get(C.SUPPORT_IE);
      var enableArchiving = config.get(C.ENABLE_ARCHIVING, config);
      var enableArchiveManager = enableArchiving && config.get(C.ENABLE_ARCHIVE_MANAGER);
      var enableMuteAll = config.get(C.ENABLE_MUTE_ALL);
      var enableStopReceivingVideo = config.get(C.ENABLE_STOP_RECEIVING_VIDEO);
      var maxUsersPerRoom = config.get(C.MAX_USERS_PER_ROOM);
      var enableScreensharing = config.get(C.ENABLE_SCREENSHARING);
      var enablePrecallTest = config.get(C.ENABLE_PRECALL_TEST);
      var enableAnnotations = enableScreensharing && config.get(C.ENABLE_ANNOTATIONS);
      var enableRoomLocking = config.get(C.ENABLE_ROOM_LOCKING);
      var feedbackUrl = config.get(C.FEEDBACK_URL);
      var reportIssueLevel = config.get(C.REPORT_ISSUE_LEVEL);
      var hotjarId = config.get(C.HOTJAR_ID);
      var hotjarVersion = config.get(C.HOTJAR_VERSION);
      var enableFeedback = config.get(C.ENABLE_FEEDBACK);

      roomBlackList = config.get(C.BLACKLIST) ?
        config.get(C.BLACKLIST).split(',').map(word => word.trim().toLowerCase()) : [];

      // Adobe tracking
      var adobeTrackingUrl = config.get(C.ADOBE_TRACKING_URL);
      var ATPrimaryCategory = config.get(C.ADOBE_TRACKING_PRIMARY_CATEGORY);
      var ATSiteIdentifier = config.get(C.ADOBE_TRACKING_SITE_IDENTIFIER);
      var ATFunctionDept = config.get(C.ADOBE_TRACKING_FUNCTION_DEPT);

      return {
        otInstance,
        precallOtInstance,
        apiKey,
        apiSecret,
        precallApiKey,
        precallApiSecret,
        archivePollingTO,
        archivePollingTOMultiplier,
        maxSessionAgeMs,
        allowIframing,
        chromeExtId,
        defaultTemplate,
        templatingSecret,
        archiveAlways,
        iosAppId,
        iosUrlPrefix,
        isWebRTCVersion,
        enableArchiving,
        enableArchiveManager,
        enableMuteAll,
        enableStopReceivingVideo,
        enableScreensharing,
        enableAnnotations,
        enablePrecallTest,
        enableRoomLocking,
        feedbackUrl,
        hotjarId,
        hotjarVersion,
        enableFeedback,
        enableSip,
        opentokJsUrl,
        showTos,
        sipUri,
        sipUsername,
        sipPassword,
        sipRequireGoogleAuth,
        supportIE,
        meetingsRatePerMinute,
        publisherResolution,
        googleId,
        googleHostedDomain,
        reportIssueLevel,
        useGoogleFonts,
        jqueryUrl,
        minMeetingNameLength,
        maxUsersPerRoom,
        adobeTrackingUrl,
        ATPrimaryCategory,
        ATSiteIdentifier,
        ATFunctionDept,
        mediaMode,
      };
    });
  }

  function configReady(aReq, aRes, aNext) {
    tbConfigPromise.then((tbConfig) => {
      aReq.tbConfig = tbConfig;
      aNext();
    });
  }


  function iframingOptions(aReq, aRes, aNext) {
    // By default, and the fallback also in case of misconfiguration is 'never'
    switch (aReq.tbConfig.allowIframing) {
      case 'always': // Nothing to do
        break;
      case 'sameorigin':
        aRes.set('X-Frame-Options', 'SAMEORIGIN');
        break;
      default:
        aRes.set('X-Frame-Options', 'DENY');
    }
    aNext();
  }

  function featureEnabled(aReq, aRes, aNext) {
    var disabledFeatures = aReq.tbConfig.disabledFeatures;
    if (!disabledFeatures) {
      aNext();
      return;
    }
    var path = aReq.path;
    if (disabledFeatures.filter(feature => path.search('\\/' + feature + '(\\/|$)') !== -1).length > 0) {
      logger.log('featureEnabled: Refusing to serve disabled feature: ' + path);
      aRes.status(400).send(new ErrorInfo(400, 'Unauthorized access'));
    } else {
      aNext();
    }
  }
  function getMeetingCompletion(aReq, aRes) {
    var language = getUserLanguage(accepts(aReq).languages());
    var country = getUserCountry(aReq);
    logger.log('getMeetingCompletion ' + aReq.path);
    aRes.render('endMeeting.ejs', {
      hotjarId: aReq.tbConfig.hotjarId,
      hotjarVersion: aReq.tbConfig.hotjarVersion,
      enableFeedback: aReq.tbConfig.enableFeedback,
      adobeTrackingUrl: aReq.tbConfig.adobeTrackingUrl,
      ATPrimaryCategory: aReq.tbConfig.ATPrimaryCategory,
      ATSiteIdentifier: aReq.tbConfig.ATSiteIdentifier,
      ATFunctionDept: aReq.tbConfig.ATFunctionDept,
      userLanguage: language,
      userCountry: country,
    }, (err, html) => {
      if (err) {
        logger.error('getMeetingCompletion. error: ', err);
        aRes.status(500).send(new ErrorInfo(500, 'Invalid Template'));
      } else {
        aRes.send(html);
      }
    });
  }
  function getRoomArchive(aReq, aRes) {
    logger.log('getRoomArchive ' + aReq.path, 'roomName: ' + aReq.params.roomName);
    var tbConfig = aReq.tbConfig;
    var roomName = aReq.params.roomName.toLowerCase();
    if (isInBlacklist(roomName)) {
      logger.log('getRoom. error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.otInstance,
                                      tbConfig.maxSessionAgeMs,
                                      tbConfig.archiveAlways,
                                      tbConfig.mediaMode))
      .then((usableSessionInfo) => {
        serverPersistence.setKeyEx(Math.round(tbConfig.maxSessionAgeMs / 1000),
          redisRoomPrefix + roomName, JSON.stringify(usableSessionInfo));
        var sessionId = usableSessionInfo.sessionId;
        tbConfig.otInstance.listArchives_P({ offset: 0, count: 1000 })
          .then((aArchives) => {
            var archive = aArchives.reduce((aLastArch, aCurrArch) =>
              aCurrArch.sessionId === sessionId &&
              aCurrArch.createdAt > aLastArch.createdAt &&
              (aCurrArch || aLastArch), { createdAt: 0 });

            if (!archive.sessionId || !archive.url) {
              aRes.status(404).send(new ErrorInfo(404, 'Unknown archive'));
            } else {
              aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
              aRes.set('Pragma', 'no-cache');
              aRes.set('Expires', 0);

              aRes.render('archivePreview.ejs', {
                archiveName: archive.name,
                archiveURL: archive.url,
              });
            }
          })
          .catch((error) => {
            logger.log('getRoomArchive. Error:', error);
            aRes.status(400).send(error);
          });
      }).catch((error) => {
        logger.log('getRoomArchive. Error:', error);
        aRes.status(400).send(error);
      });
  }

  // Update archive callback. TO-DO: Is there any way of restricting calls to this?
  function postUpdateArchiveInfo(aReq, aRes) {
    var archive = aReq.body;
    var tbConfig = aReq.tbConfig;
    var fbArchives = tbConfig.fbArchives;
    if (!archive.sessionId || !archive.id) {
      logger.log('postUpdateArchiveInfo: Got an invalid call! Ignoring.', archive);
    } else if (archive.status === 'available' || archive.status === 'updated') {
      logger.log('postUpdateArchiveInfo: Updating information for archive:', archive.id);
      fbArchives.updateArchive(archive.sessionId, archive);
    } else {
      logger.log('postUpdateArchiveInfo: Ignoring updated status for', archive.id, ':',
                 archive.status);
    }
    aRes.send({});
  }

  // Returns the personalized root page
  async function getRoot(aReq, aRes) {
    var meetingAllowed = await isMeetingAllowed(aReq);
    var language = getUserLanguage(accepts(aReq).languages());
    var country = getUserCountry(aReq);

    aRes
      .render('index.ejs', {
        roomName: `${haikunator.haikunate({ tokenLength: 0 })}-${haikunator.haikunate()}`,
        isWebRTCVersion: aReq.tbConfig.isWebRTCVersion,
        minMeetingNameLength: aReq.tbConfig.minMeetingNameLength,
        publisherResolution: aReq.tbConfig.publisherResolution,
        showTos: aReq.tbConfig.showTos,
        showUnavailable: !meetingAllowed,
        useGoogleFonts: aReq.tbConfig.useGoogleFonts,
        supportIE: aReq.tbConfig.supportIE,
        adobeTrackingUrl: aReq.tbConfig.adobeTrackingUrl,
        ATPrimaryCategory: aReq.tbConfig.ATPrimaryCategory,
        ATSiteIdentifier: aReq.tbConfig.ATSiteIdentifier,
        ATFunctionDept: aReq.tbConfig.ATFunctionDept,
        userLanguage: language,
        userCountry: country,
        hotjarId: aReq.tbConfig.hotjarId,
        hotjarVersion: aReq.tbConfig.hotjarVersion,
        enableFeedback: aReq.tbConfig.enableFeedback,
        opentokJsUrl: aReq.tbConfig.opentokJsUrl,
        enablePrecallTest: aReq.tbConfig.enablePrecallTest,
        enterButtonLabel: 'Start Meeting',
      }, (err, html) => {
        if (err) {
          logger.error('getRoot. error: ', err);
          aRes.status(500).send(new ErrorInfo(500, 'Invalid Template'));
        } else {
          aRes.send(html);
        }
      });
  }

  function isInBlacklist(name) {
    return roomBlackList.includes(name.trim().toLowerCase());
  }

  // Finish the call to getRoom and postRoom
  async function finshGetPostRoom(aReq, aRes, routedFromStartMeeting) {
    var meetingAllowed = await isMeetingAllowed(aReq);
    var query = aReq.query;

    if (isInBlacklist(aReq.params.roomName)) {
      logger.log('getRoom. error:', `Blacklist found '${aReq.params.roomName}'`);
      return aRes.status(404).send(null);
    }
    var tbConfig = aReq.tbConfig;
    var template = query && tbConfig.templatingSecret &&
      (tbConfig.templatingSecret === query.template_auth) && query.template;
    var userName = (aReq.body && aReq.body.userName) || (query && query.userName) || '';
    var language = getUserLanguage(accepts(aReq).languages());
    var country = getUserCountry(aReq);

    // Create a session ID and token for the network test
    tbConfig.precallOtInstance.createSession({ mediaMode: 'routed' }, (error, testSession) => {
      // We really don't want to cache this
      aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      aRes.set('Pragma', 'no-cache');
      aRes.set('Expires', 0);
      aRes
        .render((template || tbConfig.defaultTemplate) + '.ejs',
        {
          userName: htmlEscape(userName || C.DEFAULT_USER_NAME),
          roomName: htmlEscape(aReq.params.roomName),
          chromeExtensionId: tbConfig.chromeExtId,
          iosAppId: tbConfig.iosAppId,
                 // iosUrlPrefix should have something like:
                 // https://opentokdemo.tokbox.com/room/
                 // or whatever other thing that should be before the roomName
          iosURL: tbConfig.iosUrlPrefix + htmlEscape(aReq.params.roomName) + '?userName=' +
                         (userName || C.DEFAULT_USER_NAME),
          enableArchiving: tbConfig.enableArchiving,
          enableArchiveManager: tbConfig.enableArchiveManager,
          enableMuteAll: tbConfig.enableMuteAll,
          enableStopReceivingVideo: tbConfig.enableStopReceivingVideo,
          maxUsersPerRoom: tbConfig.maxUsersPerRoom,
          enableScreensharing: tbConfig.enableScreensharing,
          enableAnnotation: tbConfig.enableAnnotations,
          enablePrecallTest: tbConfig.enablePrecallTest,
          enableRoomLocking: tbConfig.enableRoomLocking,
          feedbackUrl: tbConfig.feedbackUrl,
          precallSessionId: testSession.sessionId,
          apiKey: tbConfig.apiKey,
          precallApiKey: tbConfig.precallApiKey,
          precallToken: tbConfig.precallOtInstance.generateToken(testSession.sessionId, {
            role: 'publisher',
          }),
          hasSip: tbConfig.enableSip,
          showTos: tbConfig.showTos,
          showUnavailable: !meetingAllowed,
          publisherResolution: tbConfig.publisherResolution,
          opentokJsUrl: tbConfig.opentokJsUrl,
          authDomain: tbConfig.googleHostedDomain,
          useGoogleFonts: tbConfig.useGoogleFonts,
          supportIE: tbConfig.supportIE,
          jqueryUrl: tbConfig.jqueryUrl,
          adobeTrackingUrl: aReq.tbConfig.adobeTrackingUrl,
          ATPrimaryCategory: aReq.tbConfig.ATPrimaryCategory,
          ATSiteIdentifier: aReq.tbConfig.ATSiteIdentifier,
          ATFunctionDept: aReq.tbConfig.ATFunctionDept,
          userLanguage: language,
          userCountry: country,
          hotjarId: tbConfig.hotjarId,
          hotjarVersion: tbConfig.hotjarVersion,
          enableFeedback: tbConfig.enableFeedback,
          enterButtonLabel: 'Join Meeting',
          routedFromStartMeeting: Boolean(routedFromStartMeeting),
          userName,
        }, (err, html) => {
          if (err) {
            logger.log('getRoom. error:', err);
            aRes.status(400).send(new ErrorInfo(400, 'Unknown template.'));
          } else {
            aRes.send(html);
          }
        });
    });
  }

  // Finish the call to getRoom and postRoom
  function getRoom(aReq, aRes, routedFromStartMeeting) {
    var query = aReq.query;

    logger.log('getRoom serving ' + aReq.path, 'roomName:', aReq.params.roomName,
               'userName:', query && query.userName,
               'template:', query && query.template);

    finshGetPostRoom(aReq, aRes, false);
  };
  
  // Return the personalized HTML for a room when directed from the root.
  function postRoom(aReq, aRes) {
    logger.log('postRoom serving ' + aReq.path, 'roomName:', aReq.params.roomName,
      'body:', aReq.body);
    finshGetPostRoom(aReq, aRes, true);
  }

  // Given a sessionInfo (which might be empty or non usable) returns a promise than will fullfill
  // to an usable sessionInfo. This function cannot be invoked directly, it has
  // to be bound so 'this' is a valid Opentok instance!
  function _getUsableSessionInfo(aMaxSessionAge, aArchiveAlways, aMediaMode, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve) => {
      var minLastUsage = Date.now() - aMaxSessionAge;

      logger.log('getUsableSessionInfo. aSessionInfo:', JSON.stringify(aSessionInfo),
                 'minLastUsage: ', minLastUsage, 'maxSessionAge:', aMaxSessionAge,
                 'archiveAlways: ', aArchiveAlways,
                 'mediaMode: ', aMediaMode);

      if (!aSessionInfo || aSessionInfo.lastUsage <= minLastUsage) {
        // We need to create a new session...
        var sessionOptions = { mediaMode: aMediaMode };
        if (aArchiveAlways) {
          sessionOptions.archiveMode = 'always';
        }

        getAppUsage().then((usage) => {
          if (usage.lastUpdate + 60000 < Date.now()) {
            setAppUsage(Date.now(), 1);
          } else {
            setAppUsage(usage.lastUpdate, ++usage.meetings);
          }
        });

        this
          .createSession(sessionOptions, (error, session) => {
            resolve({
              sessionId: session.sessionId,
              lastUsage: Date.now(),
              inProgressArchiveId: undefined,
              isLocked: false
            });
          });
      } else {
        // We only need to update the last usage data...
        aSessionInfo.lastUsage = Date.now();
        resolve(aSessionInfo);
      }
    });
  }
  
  function getAppUsage() {
    return new Promise((resolve) => {
      const initial = { lastUpdate: Date.now(), meetings: 0 };
      serverPersistence
        .getKey('APP_USAGE_').then((usage) => {
          if (!usage) return resolve(initial);
          else return resolve(JSON.parse(usage));
        }).catch((e) => {
          return resolve(initial);
        });
    });
  }

  async function isMeetingAllowed(aReq) {
    return new Promise((resolve) => {
      if (aReq.tbConfig.meetingsRatePerMinute === 0) 
        return resolve(false);
      else if (aReq.tbConfig.meetingsRatePerMinute < 0)
        return resolve(true);
      getAppUsage().then((usage) => {
        return resolve(usage.lastUpdate + 60000 < Date.now() || usage.meetings < aReq.tbConfig.meetingsRatePerMinute);
      });
    });
  }

  function setAppUsage(date, meetings) {
    serverPersistence
      .setKey('APP_USAGE_', JSON.stringify({lastUpdate: date, meetings}));
  }

  function getRoomRawInfo(aReq, aRes) {
    var roomName = aReq.params.roomName.toLowerCase();
    serverPersistence
      .getKey(redisRoomPrefix + roomName).then((room) => {
        if (!room) return aRes.status(404).send(null);
        aRes.send(JSON.parse(room));
      });
  }

  function decodeOtToken(token) { 
    var parsed = {};
    var encoded = token.substring(4);   // remove 'T1=='
    var decoded = new Buffer(encoded, "base64").toString("ascii");
    var tokenParts = decoded.split(':');
    tokenParts.forEach(function(part) {
      _.merge(parsed, qs.parse(part));
    });
    return parsed;
  }

  function lockRoom(aReq, aRes) {
    var roomName = aReq.params.roomName.toLowerCase();
    serverPersistence
      .getKey(redisRoomPrefix + roomName).then((room) => {
        if (!room) return aRes.status(404).send(null);

        var decToken = decodeOtToken(aReq.body.token);
        room = JSON.parse(room);

        if (decToken.expire_time * 1000 < Date.now() || decToken.session_id !== room.sessionId)
          return aRes.status(403).send(new Error('Unauthorized'));
        
        room.isLocked = aReq.body.state === 'locked';
        serverPersistence
          .setKey(redisRoomPrefix + roomName, room);
        aRes.send(room);
      });
  }

  // Get the information needed to connect to a session
  // (creates it also if it isn't created already).
  // Returns:
  // RoomInfo {
  //   sessionId: string
  //   apiKey: string
  //   token: string
  //   username: string
  //   chromeExtId: string value || 'undefined'
  // }
  var _numAnonymousUsers = 1;
  function getRoomInfo(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var fbArchives = tbConfig.fbArchives;
    var roomName = aReq.params.roomName.toLowerCase();
    var userName =
      (aReq.query && aReq.query.userName) || C.DEFAULT_USER_NAME + _numAnonymousUsers++;
    logger.log('getRoomInfo serving ' + aReq.path, 'roomName: ', roomName, 'userName: ', userName);
    var enableArchiveManager = tbConfig.enableArchiveManager;

    if (isInBlacklist(roomName)) {
      logger.log('getRoomInfo. error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }

    // We have to check if we have a session id stored already on the persistence provider (and if
    // it's not too old).
    // Note that we do not persist tokens.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.otInstance, tbConfig.maxSessionAgeMs,
                                      tbConfig.archiveAlways, tbConfig.mediaMode))
      .then((usableSessionInfo) => {
        // Update the database. We could do this on getUsable...
        serverPersistence.setKeyEx(Math.round(tbConfig.maxSessionAgeMs / 1000),
          redisRoomPrefix + roomName, JSON.stringify(usableSessionInfo));

        // and finally, answer...
        var answer = {
          apiKey: tbConfig.apiKey,
          token: tbConfig.otInstance
                  .generateToken(usableSessionInfo.sessionId, {
                    role: 'publisher',
                    data: JSON.stringify({ userName }),
                  }),
          username: userName,
          chromeExtId: tbConfig.chromeExtId,
          enableArchiveManager: tbConfig.enableArchiveManager,
          enableAnnotation: tbConfig.enableAnnotations,
          enableArchiving: tbConfig.enableArchiving,
          enableSip: tbConfig.enableSip,
          requireGoogleAuth: tbConfig.sipRequireGoogleAuth,
          googleId: tbConfig.googleId,
          googleHostedDomain: tbConfig.googleHostedDomain,
          reportIssueLevel: tbConfig.reportIssueLevel,
        };
        answer[aReq.sessionIdField || 'sessionId'] = usableSessionInfo.sessionId;
        aRes.send(answer);
      });
  }

  function _getUpdatedArchiveInfo(aTbConfig, aOperation, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    if (!aSessionInfo) {
      throw new ErrorInfo(104, 'Invalid (non existant) room');
    }

    logger.log('_getUpdatedArchiveInfo: ', aSessionInfo);
    var minLastUsage = Date.now() - aTbConfig.maxSessionAgeMs;
    // What do we do if we get an order for an expired session? Since if it's expired then
    // nobody should be on and as such there will not be any streams... if it's expired we just
    // return an error
    if (aSessionInfo.lastUsage <= minLastUsage) {
      throw new ErrorInfo(101, 'Invalid (expired) room');
    }

    if (aOperation.startsWith('start') && aSessionInfo.inProgressArchiveId) {
      // Hmm.. this might be an error or that somehow we lost the stop event... doesn't hurt to
      // be sure
      logger.log('_getUpdatedArchiveInfo: Getting update info for archive: ',
                 aSessionInfo.inProgressArchiveId);
      return aTbConfig.otInstance
        .getArchive_P(aSessionInfo.inProgressArchiveId)
        .then((aArchiveInfo) => {
          if (aArchiveInfo.status === 'started') {
            throw new ErrorInfo(102, 'Recording already in progress');
          } else {
            aSessionInfo.inProgressArchiveId = undefined;
          }
          return aSessionInfo;
        }).catch((e) => {
          if (e.code === 102) {
            throw e;
          }
          // This should mean that the archive doesn't exist. Just go with the flow...
          aSessionInfo.inProgressArchiveId = undefined;
          return aSessionInfo;
        });
    } else if (aOperation.startsWith('stop') && !aSessionInfo.inProgressArchiveId) {
      return aTbConfig.otInstance.listArchives_P({ offset: 0, count: 100 })
        .then(aArch => aArch.filter(aArchive => aArchive.sessionId === aSessionInfo.sessionId))
        .then((aArchives) => {
          var recordingInProgress = aArchives[0] && aArchives[0].status === 'started';
          if (recordingInProgress) {
            aSessionInfo.inProgressArchiveId = aArchives[0].id;
          } else {
            throw new ErrorInfo(105, 'Cannot stop a non existant recording');
          }
          return aSessionInfo;
        });
    }
      // We might still need to update the archive information but for now consider it's valid.
    return aSessionInfo;
  }

  // /room/:roomName/archive?userName=username&operation=startComposite|startIndividual|stop
  // Returns ArchiveInfo:
  // { archiveId: string, archiveType: string }
  function postRoomArchive(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var body = aReq.body;
    if (!body || !body.userName || !body.operation) {
      logger.log('postRoomArchive => missing body parameter: ', aReq.body);
      aRes.status(400).send(new ErrorInfo(100, 'Missing required parameter'));
      return;
    }
    var roomName = aReq.params.roomName.toLowerCase();
    var userName = body.userName;
    var operation = body.operation;
    var otInstance = tbConfig.otInstance;

    if (isInBlacklist(roomName)) {
      logger.log('postRoomArchive error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }

    logger.log('postRoomArchive serving ' + aReq.path, 'roomName:', roomName,
               'userName:', userName);
    // We could also keep track of the current archive ID on the client app. But the proposed
    // API makes it simpler for the client app, since it only needs the room name to stop an
    // in-progress recording. So we can just get the sessionInfo from the serverPersistence.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUpdatedArchiveInfo.bind(undefined, tbConfig, operation))
      .then((sessionInfo) => {
        var now = new Date();
        var archiveOptions = {
          name: userName + ' ' + now.toLocaleDateString() + ' ' + now.toLocaleTimeString(),
        };
        var archiveOp;
        switch (operation) {
          case 'startIndividual':
            archiveOptions.outputMode = 'individual';
            // falls through
          case 'startComposite':
            logger.log('Binding archiveOp to startArchive with sessionId:', sessionInfo.sessionId);
            archiveOptions.resolution = '1280x720';
            archiveOp =
              otInstance.startArchive_P.bind(otInstance, sessionInfo.sessionId, archiveOptions);
            break;
          case 'stop':
            archiveOp = otInstance.stopArchive_P.bind(otInstance, sessionInfo.inProgressArchiveId);
            break;
        }
        logger.log('postRoomArchive: Invoking archiveOp. SessionInfo', sessionInfo);
        return archiveOp().then((aArchive) => {
          sessionInfo.inProgressArchiveId = aArchive.status === 'started' ? aArchive.id : undefined;
          // Update the internal database
          serverPersistence.setKey(redisRoomPrefix + roomName, JSON.stringify(sessionInfo));

          // We need to update the external database also. We have a conundrum here, though.
          // At this point, if the operation requested was stopping an active recording, the
          // archive information will not be updated yet. We can wait to be notified (by a callback)
          // or poll for the information. Since polling is less efficient, we do so only when
          // required by the configuration.
          var readyToUpdateDb =
            (operation === 'stop' && tbConfig.archivePollingTO &&
             _launchArchivePolling(otInstance, aArchive.id,
                                   tbConfig.archivePollingTO,
                                   tbConfig.archivePollingTOMultiplier)) ||
            Promise.resolve(aArchive);

          const roomArchiveStorage = new ArchiveLocalStorage(otInstance, redisRoomPrefix + roomName);
          readyToUpdateDb
            .then((aUpdatedArchive) => {
              aUpdatedArchive.localDownloadURL = '/archive/' + aArchive.id;
              operation !== 'stop' && (aUpdatedArchive.recordingUser = userName);
              roomArchiveStorage.updateArchive(aUpdatedArchive);
            });

          logger.log('postRoomArchive => Returning archive info: ', aArchive.id);
          aRes.send({
            archiveId: aArchive.id,
            archiveType: aArchive.outputMode,
          });
        });
      })
      .catch((error) => {
        logger.log('postRoomArchive. Sending error:', error);
        aRes.status(400).send(error);
      });
  }

  function getArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    var generatePreview = (aReq.query && aReq.query.generatePreview !== undefined);
    logger.log('getAchive:', archiveId, generatePreview);

    aReq.tbConfig.otInstance
      .getArchive_P(archiveId)
      .then((aArchive) => {
        if (!generatePreview) {
          aRes.redirect(301, aArchive.url);
          return;
        }

        aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
        aRes.set('Pragma', 'no-cache');
        aRes.set('Expires', 0);

        aRes.render('archivePreview.ejs', {
          archiveName: aArchive.name,
          archiveURL: aArchive.url,
          hotjarId: aReq.tbConfig.hotjarId,
          hotjarVersion: aReq.tbConfig.hotjarVersion,
          enableFeedback: aReq.tbConfig.enableFeedback,
        });
      }).catch((e) => {
        logger.error('getArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function getRoomNameFromHeaders(headers) {
    const referer = headers.referer;
    var lastIndex = referer.lastIndexOf('/');
    return referer.substr(lastIndex + 1, referer.length).split('?')[0];
  }

  function deleteArchive(aReq, aRes) {
    var archiveId = aReq.params.archiveId;
    logger.log('deleteArchive:', archiveId);
    var tbConfig = aReq.tbConfig;
    var otInstance = tbConfig.otInstance;
    var sessionId;
    var type;
    const roomName = getRoomNameFromHeaders(aReq.headers);
    const roomArchiveStorage = new ArchiveLocalStorage(otInstance, redisRoomPrefix + roomName);

    otInstance
      .getArchive_P(archiveId) // This is only needed so we can get the sesionId
      .then((aArchive) => {
        sessionId = aArchive.sessionId;
        type = aArchive.outputMode;
        return archiveId;
      })
      .then(otInstance.deleteArchive_P)
      .then(() => roomArchiveStorage.removeArchive(archiveId))
      .then(() => aRes.send({ id: archiveId, type }))
      .catch((e) => {
        logger.error('deleteArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  // /room/:roomName/dial
  // Returns DialInfo:
  // { number: string, status: string }
  function postRoomDial(aReq, aRes) {
    var tbConfig = aReq.tbConfig;
    var roomName = aReq.params.roomName.toLowerCase();
    var body = aReq.body;
    var phoneNumber = body.phoneNumber;
    var googleIdToken = body.googleIdToken;
    if (isInBlacklist(roomName)) {
      logger.log('postRoomDial. error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }
    if (!tbConfig.enableSip) {
      return aRes.status(400).send(new ErrorInfo(400, 'Phone dial-out not allowed.'));
    }
    if (!body || !body.phoneNumber) {
      logger.log('postRoomDial => missing body parameter: ', aReq.body);
      return aRes.status(400).send(new ErrorInfo(400, 'Missing required parameter'));
    }
    return googleAuth.verifyIdToken(googleIdToken).then(() =>
          serverPersistence
          .getKey(redisRoomPrefix + roomName, true)
          .then((sessionInfo) => {
            const sessionId = sessionInfo.sessionId;
            const token = tbConfig.otInstance.generateToken(sessionId, {
              role: 'publisher',
              data: '{"sip":true, "role":"client", "name":"' + phoneNumber + '"}',
            });
            sipUri = `sip:+${phoneNumber}@sip.nexmo.com;transport=tls`;
            var options = {
              auth: {
                username: tbConfig.sipUsername,
                password: tbConfig.sipPassword,
              },
              secure: false,
            };
            tbConfig.otInstance.dial_P(sessionId, token, sipUri, options)
              .then((sipCallData) => {
                var dialedNumberInfo = {};
                dialedNumberInfo.sessionId = sipCallData.sessionId;
                dialedNumberInfo.connectionId = sipCallData.connectionId;
                dialedNumberInfo.googleIdToken = googleIdToken;
                serverPersistence.setKey(redisPhonePrefix + phoneNumber,
                                         JSON.stringify(dialedNumberInfo));
                return aRes.send(sipCallData);
              })
              .catch((error) => {
                logger.log('postRoomDial error', error);
                return aRes.status(400).send(new ErrorInfo(400, 'An error ocurred while forwarding SIP Call'));
              });
          }))
      .catch((err) => {
        logger.log('postRoomDial => authentication error: ', err);
        return aRes.status(401).send(new ErrorInfo(401, 'Authentication Error'));
      });
  }
  // /hang-up
  // A web client that initiated a SIP call is requesting that we hang up
  function postHangUp(aReq, aRes) {
    var body = aReq.body;
    var phoneNumber = body.phoneNumber;
    var googleIdToken = body.googleIdToken;
    var tbConfig = aReq.tbConfig;
    serverPersistence.getKey(redisPhonePrefix + phoneNumber, true)
      .then((dialedNumberInfo) => {
        if (!dialedNumberInfo || dialedNumberInfo.googleIdToken !== googleIdToken) {
          return aRes.status(400).send(new ErrorInfo(400, 'Unknown phone number.'));
        }
        return tbConfig.otInstance.forceDisconnect_P(dialedNumberInfo.sessionId,
          dialedNumberInfo.connectionId).then(() => {
            serverPersistence.delKey(redisPhonePrefix + phoneNumber);
            return aRes.send({});
          });
      });
  }


  function loadConfig() {
    tbConfigPromise = _initialTBConfig();
    return tbConfigPromise;
  }

  // /health
  // Checks the ability to connect to external services used by the app
  function getHealth(aReq, aRes) {
    testHealth(aReq.tbConfig, googleAuth)
    .then((healthObj) => {
      aRes.send(healthObj);
    })
    .catch((healthObj) => {
      aRes.status(400).send(healthObj);
    });
  }

  function setSecurityHeaders(aReq, aRes, aNext) {
    aRes.set('X-XSS-Protection', '1; mode=block');
    aRes.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    aRes.set('Pragma', 'no-cache');
    aRes.set('Expires', 0);
    aRes.set('X-Content-Type-Options', 'nosniff');

    aNext();
  }

  return {
    logger,
    configReady,
    securityHeaders,
    iframingOptions,
    featureEnabled,
    loadConfig,
    lockRoom,
    getRoot,
    getRoom,
    postRoom,
    getRoomInfo,
    postRoomArchive,
    postUpdateArchiveInfo,
    getArchive,
    deleteArchive,
    getRoomArchive,
    postRoomDial,
    postHangUp,
    getHealth,
    getRoomRawInfo,
    setSecurityHeaders,
    getMeetingCompletion,
  };
}

module.exports = ServerMethods;
