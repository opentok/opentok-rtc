// This file implements the API described in api.yml

// Note: Since we're not putting the TB key and data here, and don't really want
// to have a not-checked-in file for that either, we're just going to store them
// on redis (and they should be already stored when this runs).
// Just run:
// redis-cli set tb_api_key yourkeyhere
// redis-cli set tb_api_secret yoursecrethere
// Once before trying to run this.
// The second argument is only really needed for the unit tests.

const SwaggerBP = require('swagger-boilerplate');
const helmet = require('helmet');
const Haikunator = require('haikunator');
const _ = require('lodash');
const qs = require('qs');
const accepts = require('accepts');
const geoip = require('geoip-lite');
const C = require('./serverConstants');
const configLoader = require('./configLoader');
const ArchiveLocalStorage = require('./archiveLocalStorage');
const GoogleAuth = require('./googleAuthStrategies');
const testHealth = require('./testHealth');
// const { Video } = require('@vonage/video')
const { Auth } = require('@vonage/auth')

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
}

function getUserLanguage(acceptedLanguages) {
  let language = '';

  if (acceptedLanguages && acceptedLanguages[0]) {
    [language] = acceptedLanguages;

    if (language.indexOf('-') !== -1) {
      [language] = language.split('-');
    } else if (language.indexOf('_') !== -1) {
      [language] = language.split('_');
    }
  }

  return language;
}

function getUserCountry(req) {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const geo = geoip.lookup(ip) || {};

  return _.get(geo, 'country', '').toLowerCase();
}

const securityHeaders = helmet({
  referrerPolicy: { policy: 'no-referrer-when-downgrade' },
  contentSecurityPolicy: false,
  frameGuard: false, // configured by tbConfig.allowIframing
});

function ServerMethods(aLogLevel, aModules) {
  aModules = aModules || {};

  const { ErrorInfo } = SwaggerBP;

  const { env } = process;
  const { Utils } = SwaggerBP;

  const Logger = Utils.MultiLevelLogger;
  // const { promisify } = Utils;

  const Video = aModules.Video || require('@vonage/video').Video; // eslint-disable-line global-require
  // if (aModules.Video) {
  //   const Video = aModules.Video
  // } else {
  //   const { Video } = require('@vonage/video')
  // }

  let roomBlackList;

  const logger = new Logger('ServerMethods', aLogLevel);
  const { ServerPersistence } = SwaggerBP;
  const connectionString = (aModules && aModules.params && aModules.params.persistenceConfig)
    || env.REDIS_URL || env.REDISTOGO_URL || '';
  const serverPersistence = new ServerPersistence([], connectionString, aLogLevel, aModules);

  const haikunator = new Haikunator();

  const redisRoomPrefix = C.REDIS_ROOM_PREFIX;
  const redisPhonePrefix = C.REDIS_PHONE_PREFIX;

  let sipUri;
  let googleAuth;
  let tbConfigPromise;

  // Initiates polling from the Opentok servers for changes on the status of an archive.
  // This is a *very* specific polling since we expect the archive will have already been stopped
  // by the time this launches and we're just waiting for it to be available or uploaded.
  // To try to balance not polling to often with trying to get a result fast, the polling time
  // increases exponentially (on the theory that if the archive is small it'll be copied fast
  // and if it's big we don't want to look too impatient).
  function _launchArchivePolling(aVideoInstance, aArchiveId, aTimeout, aTimeoutMultiplier) {
    return new Promise((resolve) => {
      let timeout = aTimeout;
      const pollArchive = function _pollArchive() {
        logger.log('Poll [', aArchiveId, ']: polling...');
        aVideoInstance.getArchive(aArchiveId).then((aArchive) => {
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

  function _initialTBConfig() {
    return configLoader.readConfigJson().then((config) => {
      // This will hold the configuration read from Redis
      const defaultTemplate = config.get(C.DEFAULT_TEMPLATE);
      const templatingSecret = config.get(C.TEMPLATING_SECRET);
      const apiKey = config.get(C.VIDEO_APP_ID);
      const privateKeyPath = config.get(C.VIDEO_PRIVATE_KEY_PATH)
      const precallApiKey = apiKey;
      const opentokJsUrl = config.get(C.OPENTOK_JS_URL);
      const useGoogleFonts = config.get(C.USE_GOOGLE_FONTS);
      const jqueryUrl = config.get(C.JQUERY_URL);
      
      const archivePollingTO = config.get(C.ARCHIVE_POLLING_INITIAL_TIMEOUT);
      const archivePollingTOMultiplier = config.get(C.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER);

      const credentials = new Auth({
        applicationId: apiKey,
        privateKey: privateKeyPath,
      });
      const videoInstance = Utils.CachifiedObject(Video, credentials, {})
      const allowIframing = config.get(C.ALLOW_IFRAMING);
      const archiveAlways = config.get(C.ARCHIVE_ALWAYS);

      const iosAppId = config.get(C.IOS_APP_ID);
      const iosUrlPrefix = config.get(C.IOS_URL_PREFIX);

      const enableSip = config.get(C.SIP_ENABLED);
      const sipUsername = config.get(C.SIP_USERNAME);
      const sipPassword = config.get(C.SIP_PASSWORD);
      const sipRequireGoogleAuth = config.get(C.SIP_REQUIRE_GOOGLE_AUTH);
      const googleId = config.get(C.GOOGLE_CLIENT_ID);
      const googleHostedDomain = config.get(C.GOOGLE_HOSTED_DOMAIN);
      const mediaMode = config.get(C.MEDIA_MODE);

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
      // ['startArchive', 'stopArchive', 'getArchive', 'listArchives', 'deleteArchive', 'dial',
      //   'forceDisconnect']
      //   .forEach((method) => otInstance[`${method}_P`] = promisify(otInstance[method])); // eslint-disable-line no-return-assign

      const maxSessionAge = config.get(C.OPENTOK_MAX_SESSION_AGE);
      const maxSessionAgeMs = maxSessionAge * 24 * 60 * 60 * 1000;
      const chromeExtId = config.get(C.CHROME_EXTENSION_ID);

      const showTos = config.get(C.SHOW_TOS);
      const meetingsRatePerMinute = config.get(C.MEETINGS_RATE_PER_MINUTE);
      const minMeetingNameLength = config.get(C.MIN_MEETING_NAME_LENGTH);
      const publisherResolution = config.get(C.PUBLISHER_RESOLUTION);
      const enableArchiving = config.get(C.ENABLE_ARCHIVING, config);
      const enableArchiveManager = enableArchiving && config.get(C.ENABLE_ARCHIVE_MANAGER);
      const enableMuteAll = config.get(C.ENABLE_MUTE_ALL);
      const enableEmoji = config.get(C.ENABLE_EMOJI);
      const enableStopReceivingVideo = config.get(C.ENABLE_STOP_RECEIVING_VIDEO);
      const maxUsersPerRoom = config.get(C.MAX_USERS_PER_ROOM);
      const enableScreensharing = config.get(C.ENABLE_SCREENSHARING);
      const enablePrecallTest = config.get(C.ENABLE_PRECALL_TEST);
      const enableAnnotations = enableScreensharing && config.get(C.ENABLE_ANNOTATIONS);
      const enableRoomLocking = config.get(C.ENABLE_ROOM_LOCKING);
      const feedbackUrl = config.get(C.FEEDBACK_URL);
      const reportIssueLevel = config.get(C.REPORT_ISSUE_LEVEL);
      const hotjarId = config.get(C.HOTJAR_ID);
      const hotjarVersion = config.get(C.HOTJAR_VERSION);
      const enableFeedback = config.get(C.ENABLE_FEEDBACK);
      const autoGenerateRoomName = config.get(C.AUTO_GENERATE_ROOM_NAME);
      const introText = config.get(C.INTRO_TEXT);
      const introFooterLinkText = config.get(C.INTRO_FOOTER_LINK_TEXT);
      const introFooterLinkUrl = config.get(C.INTRO_FOOTER_LINK_URL);
      const appName = config.get(C.APP_NAME);
      const helpLinkText1 = config.get(C.HELP_LINK_TEXT_1);
      const helpLinkUrl1 = config.get(C.HELP_LINK_URL_1);
      const helpLinkText2 = config.get(C.HELP_LINK_TEXT_2);
      const helpLinkUrl2 = config.get(C.HELP_LINK_URL_2);
      const oneTrustCookieConsentUrl = config.get(C.ONE_TRUST_COOKIE_CONSENT_URL);

      roomBlackList = config.get(C.BLACKLIST)
        ? config.get(C.BLACKLIST).split(',').map((word) => word.trim().toLowerCase()) : [];

      // Adobe tracking
      const adobeTrackingUrl = config.get(C.ADOBE_TRACKING_URL);
      const ATPrimaryCategory = config.get(C.ADOBE_TRACKING_PRIMARY_CATEGORY);
      const ATSiteIdentifier = config.get(C.ADOBE_TRACKING_SITE_IDENTIFIER);
      const ATFunctionDept = config.get(C.ADOBE_TRACKING_FUNCTION_DEPT);

      const startBuilidingIcidQueryString = config.get(C.START_BUILDING_ICID)
        ? `?icid=${config.get(C.START_BUILDING_ICID)}` : '';

      const contactUsIcidQueryString = config.get(C.CONTACT_US_ICID)
        ? `?icid=${config.get(C.CONTACT_US_ICID)}` : '';

      return {
        videoInstance,
        apiKey,
        precallApiKey,
        // precallApiSecret,
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
        enableEmoji,
        autoGenerateRoomName,
        introText,
        introFooterLinkText,
        introFooterLinkUrl,
        appName,
        helpLinkText1,
        helpLinkUrl1,
        helpLinkText2,
        helpLinkUrl2,
        oneTrustCookieConsentUrl,
        startBuilidingIcidQueryString,
        contactUsIcidQueryString,
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
    const { disabledFeatures } = aReq.tbConfig;
    if (!disabledFeatures) {
      aNext();
      return;
    }
    const { path } = aReq;
    if (disabledFeatures.filter((feature) => path.search(`\\/${feature}(\\/|$)`) !== -1).length > 0) {
      logger.log(`featureEnabled: Refusing to serve disabled feature: ${path}`);
      aRes.status(400).send(new ErrorInfo(400, 'Unauthorized access'));
    } else {
      aNext();
    }
  }
  function getMeetingCompletion(aReq, aRes) {
    const language = getUserLanguage(accepts(aReq).languages());
    const country = getUserCountry(aReq);
    logger.log(`getMeetingCompletion ${aReq.path}`);
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
      useGoogleFonts: aReq.tbConfig.useGoogleFonts,
      appName: aReq.tbConfig.appName,
      startBuilidingIcidQueryString: aReq.tbConfig.startBuilidingIcidQueryString,
      contactUsIcidQueryString: aReq.tbConfig.contactUsIcidQueryString,
    }, (err, html) => {
      if (err) {
        logger.error('getMeetingCompletion. error: ', err);
        aRes.status(500).send(new ErrorInfo(500, 'Invalid Template'));
      } else {
        aRes.send(html);
      }
    });
  }
  // eslint-disable-next-line consistent-return
  function getRoomArchive(aReq, aRes) {
    logger.log(`getRoomArchive ${aReq.path}`, `roomName: ${aReq.params.roomName}`);
    const { tbConfig } = aReq;
    const roomName = aReq.params.roomName.toLowerCase();
    if (isInBlacklist(roomName)) {
      logger.log('getRoom. error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.videoInstance,
        tbConfig.maxSessionAgeMs,
        tbConfig.archiveAlways,
        tbConfig.mediaMode))
      .then((usableSessionInfo) => {
        serverPersistence.setKeyEx(Math.round(tbConfig.maxSessionAgeMs / 1000),
          redisRoomPrefix + roomName, JSON.stringify(usableSessionInfo));
        const { sessionId } = usableSessionInfo;

        tbConfig.videoInstance.searchArchives({ offset: 0, count: 1000 })
          .then((aArchives) => {
            const archive = aArchives
              .reduce((aLastArch, aCurrArch) => aCurrArch.sessionId === sessionId
              && aCurrArch.createdAt > aLastArch.createdAt
              && (aCurrArch || aLastArch), { createdAt: 0 });

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
    const archive = aReq.body;
    const { tbConfig } = aReq;
    const { fbArchives } = tbConfig;
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

  async function getRoot(aReq, aRes) {
    if (aReq.tbConfig.autoGenerateRoomName) {
      const roomName = `${haikunator.haikunate({ tokenLength: 0 })}-${haikunator.haikunate()}`;
      return aRes.redirect(`/room/${roomName}`);
    }
    getRoom(aReq, aRes);
  }

  function isInBlacklist(name) {
    return roomBlackList.includes(name.trim().toLowerCase());
  }

  // Finish the call to getRoom and postRoom
  // eslint-disable-next-line consistent-return
  async function getRoom(aReq, aRes) {
    const meetingAllowed = await isMeetingAllowed(aReq);
    const { query } = aReq;

    if (aReq.params.roomName && isInBlacklist(aReq.params.roomName)) {
      logger.log('getRoom. error:', `Blacklist found '${aReq.params.roomName}'`);
      return aRes.status(404).send(null);
    }
    const { tbConfig } = aReq;
    const template = query && tbConfig.templatingSecret
      && (tbConfig.templatingSecret === query.template_auth) && query.template;
    const userName = (aReq.body && aReq.body.userName) || (query && query.userName) || '';
    const publishVideo = aReq.body && aReq.body.publishVideo
      ? JSON.parse(aReq.body.publishVideo) : true;
    const publishAudio = aReq.body && aReq.body.publishAudio
      ? JSON.parse(aReq.body.publishAudio) : true;
    const language = getUserLanguage(accepts(aReq).languages());
    const country = getUserCountry(aReq);

    // Create a session ID and token for the network test
    const testSession = await tbConfig.videoInstance.createSession({ mediaMode: 'routed' });
    logger.log('sessionId:', testSession.sessionId);


    aRes.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    aRes.set('Pragma', 'no-cache');
    aRes.set('Expires', 0);

    aRes
      .render(`${template || tbConfig.defaultTemplate}.ejs`,
        {
          autoGenerateRoomName: tbConfig.autoGenerateRoomName,
          userName: htmlEscape(userName || C.DEFAULT_USER_NAME),
          roomName: htmlEscape(aReq.params.roomName || ''),
          publishVideo,
          publishAudio,
          chromeExtensionId: tbConfig.chromeExtId,
          iosAppId: tbConfig.iosAppId,
          // iosUrlPrefix should have something like:
          // https://opentokdemo.tokbox.com/room/
          // or whatever other thing that should be before the roomName
          iosURL: `${tbConfig.iosUrlPrefix + htmlEscape(aReq.params.roomName)}?userName=${
            userName || C.DEFAULT_USER_NAME}`,
          enableArchiving: tbConfig.enableArchiving,
          enableArchiveManager: tbConfig.enableArchiveManager,
          enableMuteAll: tbConfig.enableMuteAll,
          enableEmoji: tbConfig.enableEmoji,
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
          precallToken: tbConfig.videoInstance.generateClientToken(testSession.sessionId, {
            role: 'publisher',
          }),
          hasSip: tbConfig.enableSip,
          showTos: tbConfig.showTos,
          showUnavailable: !meetingAllowed,
          publisherResolution: tbConfig.publisherResolution,
          opentokJsUrl: tbConfig.opentokJsUrl,
          authDomain: tbConfig.googleHostedDomain,
          useGoogleFonts: tbConfig.useGoogleFonts,
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
          introText: tbConfig.introText,
          introFooterLinkText: tbConfig.introFooterLinkText,
          introFooterLinkUrl: tbConfig.introFooterLinkUrl,
          appName: tbConfig.appName,
          helpLinkText1: tbConfig.helpLinkText1,
          helpLinkUrl1: tbConfig.helpLinkUrl1,
          helpLinkText2: tbConfig.helpLinkText2,
          helpLinkUrl2: tbConfig.helpLinkUrl2,
          oneTrustCookieConsentUrl: tbConfig.oneTrustCookieConsentUrl,
          // eslint-disable-next-line no-dupe-keys
          userName,
        }, (err, html) => {
              if (err) {
                logger.log('getRoom. error:', err);
                aRes.status(400).send(new ErrorInfo(400, 'Unknown template.'));
              } else {
                aRes.send(html);
              }
           }
        );
  }

  // Given a sessionInfo (which might be empty or non usable) returns a promise than will fullfill
  // to an usable sessionInfo. This function cannot be invoked directly, it has
  // to be bound so 'this' is a valid Opentok instance!
  function _getUsableSessionInfo(aMaxSessionAge, aArchiveAlways, aMediaMode, aSessionInfo) {
    aSessionInfo = aSessionInfo && JSON.parse(aSessionInfo);
    return new Promise((resolve) => {
      const minLastUsage = Date.now() - aMaxSessionAge;

      logger.log('getUsableSessionInfo. aSessionInfo:', JSON.stringify(aSessionInfo),
        'minLastUsage: ', minLastUsage, 'maxSessionAge:', aMaxSessionAge,
        'archiveAlways: ', aArchiveAlways,
        'mediaMode: ', aMediaMode);

      if (!aSessionInfo || aSessionInfo.lastUsage <= minLastUsage) {
        // We need to create a new session...
        const sessionOptions = { mediaMode: aMediaMode };
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

        this.createSession(sessionOptions)
            .then( session => {
              resolve({
                sessionId: session.sessionId,
                lastUsage: Date.now(),
                inProgressArchiveId: undefined,
                isLocked: false,
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
          return resolve(JSON.parse(usage));
        }).catch(() => resolve(initial));
    });
  }

  async function isMeetingAllowed(aReq) {
    // eslint-disable-next-line consistent-return
    return new Promise((resolve) => {
      // eslint-disable-next-line max-len
      if (aReq.tbConfig.meetingsRatePerMinute === 0) { return resolve(false); } if (aReq.tbConfig.meetingsRatePerMinute < 0) { return resolve(true); }
      getAppUsage().then((usage) => resolve(usage.lastUpdate + 60000 < Date.now()
          || usage.meetings < aReq.tbConfig.meetingsRatePerMinute));
    });
  }

  function setAppUsage(date, meetings) {
    serverPersistence
      .setKey('APP_USAGE_', JSON.stringify({ lastUpdate: date, meetings }));
  }

  async function getRoomRawInfo(aReq, aRes) {
    const roomName = aReq.params.roomName.toLowerCase();
    const room = await serverPersistence.getKey(redisRoomPrefix + roomName);
    if (!room) return aRes.status(204).send();
    aRes.send(JSON.parse(room));
  }

  function decodeOtToken(token) {
    const parsed = {};
    const encoded = token.substring(4); // remove 'T1=='
    const buffer = Buffer.from(encoded, 'base64');
    const decoded = buffer.toString('ascii');
    const tokenParts = decoded.split(':');
    tokenParts.forEach((part) => {
      _.merge(parsed, qs.parse(part));
    });
    return parsed;
  }

  async function lockRoom(aReq, aRes) {
    const roomName = aReq.params.roomName.toLowerCase();
    let room = await serverPersistence.getKey(redisRoomPrefix + roomName);
    if (!room) return aRes.status(404).send(null);

    const decToken = decodeOtToken(aReq.body.token);
    room = JSON.parse(room);

    if (decToken.expire_time * 1000 < Date.now() || decToken.session_id !== room.sessionId) { return aRes.status(403).send(new Error('Unauthorized')); }

    room.isLocked = aReq.body.state === 'locked';
    serverPersistence
      .setKey(redisRoomPrefix + roomName, room);
    aRes.send(room);
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
  let _numAnonymousUsers = 1;
  // eslint-disable-next-line consistent-return
  function getRoomInfo(aReq, aRes) {
    const { tbConfig } = aReq;
    const roomName = aReq.params.roomName.toLowerCase();
    const userName = (aReq.query && aReq.query.userName)
      || C.DEFAULT_USER_NAME + _numAnonymousUsers++;
    logger.log(`getRoomInfo serving ${aReq.path}`, 'roomName: ', roomName, 'userName: ', userName);

    if (isInBlacklist(roomName)) {
      logger.log('getRoomInfo. error:', `Blacklist found '${roomName}'`);
      return aRes.status(404).send(null);
    }

    // We have to check if we have a session id stored already on the persistence provider (and if
    // it's not too old).
    // Note that we do not persist tokens.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUsableSessionInfo.bind(tbConfig.videoInstance, tbConfig.maxSessionAgeMs,
        tbConfig.archiveAlways, tbConfig.mediaMode))
      .then((usableSessionInfo) => {
        // Update the database. We could do this on getUsable...
        serverPersistence.setKeyEx(Math.round(tbConfig.maxSessionAgeMs / 1000),
          redisRoomPrefix + roomName, JSON.stringify(usableSessionInfo));

        // and finally, answer...
        const answer = {
          apiKey: tbConfig.apiKey,
          token: tbConfig.videoInstance
          .generateClientToken(usableSessionInfo.sessionId, {
            role: 'publisher',
            data: JSON.stringify({ userName }),
          }),
          username: userName,
          autoGenerateRoomName: tbConfig.autoGenerateRoomName,
          chromeExtId: tbConfig.chromeExtId,
          enableArchiveManager: tbConfig.enableArchiveManager,
          enableAnnotation: tbConfig.enableAnnotations,
          enableArchiving: tbConfig.enableArchiving,
          enableSip: tbConfig.enableSip,
          requireGoogleAuth: tbConfig.sipRequireGoogleAuth,
          googleId: tbConfig.googleId,
          googleHostedDomain: tbConfig.googleHostedDomain,
          reportIssueLevel: tbConfig.reportIssueLevel,
          archives: usableSessionInfo.archives,
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
    const minLastUsage = Date.now() - aTbConfig.maxSessionAgeMs;
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
      return aTbConfig.videoInstance
        .getArchive(aSessionInfo.inProgressArchiveId)
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
    } if (aOperation.startsWith('stop') && !aSessionInfo.inProgressArchiveId) {
      return aTbConfig.videoInstance.searchArchives({ offset: 0, count: 100 })
        .then((aArch) => aArch.filter((aArchive) => aArchive.sessionId === aSessionInfo.sessionId))
        .then((aArchives) => {
          const recordingInProgress = aArchives[0] && aArchives[0].status === 'started';
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
    const { tbConfig } = aReq;
    const { body } = aReq;
    if (!body || !body.userName || !body.operation) {
      logger.log('postRoomArchive => missing body parameter: ', aReq.body);
      aRes.status(400).send(new ErrorInfo(100, 'Missing required parameter'));
      return;
    }
    const roomName = aReq.params.roomName.toLowerCase();
    const { userName } = body;
    const { operation } = body;
    const { videoInstance } = tbConfig;
    if (isInBlacklist(roomName)) {
      logger.log('postRoomArchive error:', `Blacklist found '${roomName}'`);
      // eslint-disable-next-line consistent-return
      return aRes.status(404).send(null);
    }

    logger.log(`postRoomArchive serving ${aReq.path}`, 'roomName:', roomName,
      'userName:', userName);
    // We could also keep track of the current archive ID on the client app. But the proposed
    // API makes it simpler for the client app, since it only needs the room name to stop an
    // in-progress recording. So we can just get the sessionInfo from the serverPersistence.
    serverPersistence
      .getKey(redisRoomPrefix + roomName)
      .then(_getUpdatedArchiveInfo.bind(undefined, tbConfig, operation))
      .then((sessionInfo) => {
        const now = new Date();
        const archiveOptions = {
          name: `${userName} ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        };
        let archiveOp;
        switch (operation) {
          case 'startIndividual':
            archiveOptions.outputMode = 'individual';
            // falls through
          case 'startComposite':
            logger.log('Binding archiveOp to startArchive with sessionId:', sessionInfo.sessionId);
            archiveOptions.resolution = '1280x720';
            archiveOp = videoInstance
              .startArchive.bind(videoInstance, sessionInfo.sessionId, archiveOptions);
            break;
          case 'stop':
            archiveOp = videoInstance
              .stopArchive.bind(videoInstance, sessionInfo.inProgressArchiveId);
            break;
          default:
            // no-op
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
          const readyToUpdateDb = (operation === 'stop' && tbConfig.archivePollingTO
             && _launchArchivePolling(videoInstance, aArchive.id,
               tbConfig.archivePollingTO,
               tbConfig.archivePollingTOMultiplier))
            || Promise.resolve(aArchive);

          const roomArchiveStorage = new ArchiveLocalStorage(
            videoInstance, redisRoomPrefix + roomName, aArchive.sessionId, aLogLevel,
          );
          readyToUpdateDb
            .then((aUpdatedArchive) => {
              aUpdatedArchive.localDownloadURL = `/archive/${aArchive.id}`;
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
    const { archiveId } = aReq.params;
    const generatePreview = (aReq.query && aReq.query.generatePreview !== undefined);
    logger.log('getAchive:', archiveId, generatePreview);

      aReq.tbConfig.videoInstance
      .getArchive(archiveId)
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
          useGoogleFonts: aReq.tbConfig.useGoogleFonts,
        });
      }).catch((e) => {
        logger.error('getArchive error:', e);
        aRes.status(405).send(e);
      });
  }

  function getRoomNameFromHeaders(headers) {
    const { referer } = headers;
    //TODO: this throw exception Cannot read properties of undefined
    const lastIndex = referer.lastIndexOf('/');
    return referer.substr(lastIndex + 1, referer.length).split('?')[0];
  }

  function deleteArchive(aReq, aRes) {
    const { archiveId } = aReq.params;
    logger.log('deleteArchive:', archiveId);
    const { tbConfig } = aReq;
    // const { otInstance } = tbConfig;
    const { videoInstance } = tbConfig;
    let sessionId;
    let type;
    //TODO: this throw exception
    const roomName = getRoomNameFromHeaders(aReq.headers);
    let roomArchiveStorage;
    videoInstance
      .getArchive(archiveId) // This is only needed so we can get the sesionId
      .then((aArchive) => {
        sessionId = aArchive.sessionId;
        type = aArchive.outputMode;
        roomArchiveStorage = new ArchiveLocalStorage(
          videoInstance, redisRoomPrefix + roomName, sessionId, aLogLevel,
        );
        return archiveId;
      })
      .then(videoInstance.deleteArchive)
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
    const { tbConfig } = aReq;
    const roomName = aReq.params.roomName.toLowerCase();
    const { body } = aReq;
    const { phoneNumber } = body;
    const { googleIdToken } = body;
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
    return googleAuth.verifyIdToken(googleIdToken).then(() => serverPersistence
      .getKey(redisRoomPrefix + roomName, true)
      .then((sessionInfo) => {
        const { sessionId } = sessionInfo;
        const token = tbConfig.videoInstance.generateClientToken(sessionId, {
          role: 'publisher',
          data: `{"sip":true, "role":"client", "name":"${phoneNumber}"}`,
        });
        sipUri = `sip:+${phoneNumber}@sip.nexmo.com;transport=tls`;
        const options = {
          auth: {
            username: tbConfig.sipUsername,
            password: tbConfig.sipPassword,
          },
          secure: false,
        };
        tbConfig.videoInstance.intiateSIPCall(sessionId, token, sipUri, options)
          .then((sipCallData) => {
            const dialedNumberInfo = {};
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
  async function postHangUp(aReq, aRes) {
    const { body } = aReq;
    const { phoneNumber } = body;
    const { googleIdToken } = body;
    const { tbConfig } = aReq;
    const dialedNumberInfo = await serverPersistence.getKey(redisPhonePrefix + phoneNumber, true);

    if (!dialedNumberInfo || dialedNumberInfo.googleIdToken !== googleIdToken) {
      return aRes.status(400).send(new ErrorInfo(400, 'Unknown phone number.'));
    }
    return tbConfig.videoInstance.disconnectClient(dialedNumberInfo.sessionId,
      dialedNumberInfo.connectionId).then(() => {
      serverPersistence.delKey(redisPhonePrefix + phoneNumber);
      return aRes.send({});
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
