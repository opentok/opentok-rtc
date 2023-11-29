// Just to have all the useful constants on a single place.

const E = module.exports;

// json config will be boolean but if environment override will be string
function parseBool(input) {
  return input === true
  || (typeof input === 'string' && input.toLowerCase() === 'true');
}

E.DEFAULT_JSON_CONFIG_PATH = '../config/config.json';

E.DEFAULT_USER_NAME = 'Anonymous User';

// A prefix for the room sessionInfo (sessionId + timestamp + inProgressArchiveId).
// inProgressArchiveId will be present (and not undefined) only if there's an archive
// operation running on that session.
// Also note that while we don't actually need to store the in-progress archive operation
// (and in fact it would be more robust if we didn't!) because we can just call listArchives
// to get that, it's more efficient if we cache it locally.
E.REDIS_ROOM_PREFIX = 'otrtc_room__';
E.REDIS_PHONE_PREFIX = 'otrtc_phone_';

E.REDIS_ROOM_MATCHES = `${E.REDIS_ROOM_PREFIX}*`;

E.VONAGE_APPLICATION_ID = { envVar: 'VONAGE_APPLICATION_ID', jsonPath: 'Vonage.applicationId', required: true };

E.VONAGE_PRIVATE_KEY_PATH = { envVar: 'VONAGE_PRIVATE_KEY', jsonPath: 'Vonage.privateKeyPath', required: true };

E.OPENTOK_PRECALL_API_KEY = { envVar: 'TB_PRECALL_API_KEY', jsonPath: 'precallTest.apiKey' };

E.OPENTOK_PRECALL_API_SECRET = { envVar: 'TB_PRECALL_API_SECRET', jsonPath: 'precallTest.apiSecret' };

E.OPENTOK_JS_URL = {
  envVar: 'TB_JS_URL', jsonPath: 'OpenTok.jsUrl', required: false, defaultValue: 'https://unpkg.com/@vonage/video-client@2/dist/js/opentok.js',
};

// Sessions should not live forever. So we'll store the last time a session was used and if when
// we fetch it from Redis we determine it's older than this max age (in days). This is the key
// where that value (in days) should be stored. By default, sessions live two days.
E.OPENTOK_MAX_SESSION_AGE = {
  envVar: 'TB_MAX_SESSION_AGE', jsonPath: 'OpenTok.maxSessionAge', defaultValue: 2, parser: parseFloat,
};

E.ENABLE_ARCHIVING = {
  envVar: 'ENABLE_ARCHIVING', jsonPath: 'Archiving.enabled', defaultValue: true, parser: parseBool,
};

E.ARCHIVE_ALWAYS = {
  envVar: 'ARCHIVE_ALWAYS', jsonPath: 'Archiving.archiveAlways', defaultValue: false, parser: parseBool,
};

// Timeout (in milliseconds) for polling for archive status change updates. Set this to zero
// to disable polling. This is the initial timeout (timeout for the first poll).
E.ARCHIVE_POLLING_INITIAL_TIMEOUT = {
  envVar: 'ARCHIVE_TIMEOUT', jsonPath: 'Archiving.pollingInitialTimeout', defaultValue: 5000, parser: parseInt,
};

// Timeout multiplier. After the first poll (if it fails) the next one will apply this multiplier
// successively. Set to a lower number to poll often.
E.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER = {
  envVar: 'TIMEOUT_MULTIPLIER', jsonPath: 'Archiving.pollingTimeoutMultiplier', defaultValue: 1.5, parser: parseFloat,
};

E.ENABLE_ARCHIVE_MANAGER = {
  envVar: 'ENABLE_ARCHIVE_MANAGER', jsonPath: 'Archiving.archiveManager.enabled', defaultValue: false, parser: parseBool,
};

E.ENABLE_MUTE_ALL = {
  envVar: 'ENABLE_MUTE_ALL', jsonPath: 'enableMuteAll', defaultValue: true, parser: parseBool,
};

E.ENABLE_EMOJI = {
  envVar: 'ENABLE_EMOJI', jsonPath: 'enableEmoji', defaultValue: false, parser: parseBool,
};

E.ENABLE_STOP_RECEIVING_VIDEO = {
  envVar: 'ENABLE_STOP_RECEIVING_VIDEO', jsonPath: 'enableStopReceivingVideo', defaultValue: true, parser: parseBool,
};

E.MAX_USERS_PER_ROOM = {
  envVar: 'MAX_USERS_PER_ROOM', jsonPath: 'maxUsersPerRoom', defaultValue: 0, parser: parseInt,
};

E.FEEDBACK_URL = { envVar: 'FEEDBACK_URL', jsonPath: 'Feedback.url', defaultValue: '' };

E.REPORT_ISSUE_LEVEL = { envVar: 'REPORT_ISSUE_LEVEL', jsonPath: 'Feedback.reportIssueLevel', defaultValue: 3 };

E.HOTJAR_ID = { envVar: 'HOTJAR_ID', jsonPath: 'Feedback.hotjarId', defaultValue: '' };

E.HOTJAR_VERSION = { envVar: 'HOTJAR_VERSION', jsonPath: 'Feedback.hotjarVersion', defaultValue: '' };

E.ENABLE_FEEDBACK = {
  envVar: 'ENABLE_FEEDBACK', jsonPath: 'Feedback.enabled', defaultValue: false, parser: parseBool,
};

E.ENABLE_SCREENSHARING = {
  envVar: 'ENABLE_SCREENSHARING', jsonPath: 'Screensharing.enabled', defaultValue: false, parser: parseBool,
};

E.ENABLE_PRECALL_TEST = {
  envVar: 'ENABLE_PRECALL_TEST', jsonPath: 'precallTest.enabled', defaultValue: true, parser: parseBool,
};

E.USE_GOOGLE_FONTS = {
  envVar: 'USE_GOOGLE_FONTS', jsonPath: 'useGoogleFonts', required: false, defaultValue: true, parser: parseBool,
};

E.JQUERY_URL = {
  envVar: 'JQUERY_URL', jsonPath: 'jqueryUrl', required: false, defaultValue: 'https://ajax.googleapis.com/ajax/libs/jquery',
};

// Chrome AddOn extension Id for sharing screen
E.CHROME_EXTENSION_ID = { envVar: 'CHROME_EXTENSION_ID', jsonPath: 'Screensharing.chromeExtensionId' };

E.ENABLE_ANNOTATIONS = {
  envVar: 'ENABLE_ANNOTATIONS', jsonPath: 'Screensharing.annotations.enabled', defaultValue: true, parser: parseBool,
};

E.ENABLE_ROOM_LOCKING = {
  envVar: 'ENABLE_ROOM_LOCKING', jsonPath: 'enableRoomLocking', defaultValue: true, parser: parseBool,
};

E.AUTO_GENERATE_ROOM_NAME = {
  envVar: 'AUTO_GENERATE_ROOM_NAME', jsonPath: 'autoGenerateRoomName', defaultValue: true, parser: parseBool,
};

// Do we want to allow being used inside an iframe?
// This can be:
//  'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
//        to reflect this, this option only changes what the server allows)
//  'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
//  'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
// We don't allow restricting it to some URIs because it doesn't work on Chrome
E.ALLOW_IFRAMING = { envVar: 'ALLOW_IFRAMING', jsonPath: 'allowIframing', defaultValue: 'never' };

E.DEFAULT_TEMPLATE = { envVar: 'DEFAULT_TEMPLATE', jsonPath: 'defaultTemplate', defaultValue: 'room' };

E.TEMPLATING_SECRET = { envVar: 'TEMPLATING_SECRET', jsonPath: 'templatingSecret' };

E.IOS_APP_ID = { envVar: 'IOS_APP_ID', jsonPath: 'IOSAppId' };

E.IOS_URL_PREFIX = { envVar: 'IOS_URL_PREFIX', jsonPath: 'IOSUrlPrefix', defaultValue: '' };

E.SHOW_TOS = {
  envVar: 'SHOW_TOS', jsonPath: 'showTos', defaultValue: false, parser: parseBool,
};

E.MEETINGS_RATE_PER_MINUTE = { envVar: 'MEETINGS_RATE_PER_MINUTE', jsonPath: 'meetingsRatePerMinute', defaultValue: -1 };

E.MIN_MEETING_NAME_LENGTH = { envVar: 'MIN_MEETING_NAME_LENGTH', jsonPath: 'minMeetingNameLength', defaultValue: 0 };

E.PUBLISHER_RESOLUTION = { envVar: 'PUBLISHER_RESOLUTION', jsonPath: 'OpenTok.publisherResolution', defaultValue: '1280x720' };

E.SIP_ENABLED = {
  envVar: 'SIP_ENABLED', jsonPath: 'SIP.enabled', defaultValue: false, parser: parseBool,
};

E.SIP_URI = { envVar: 'SIP_URI', jsonPath: 'SIP.uri', defaultValue: '' };

E.SIP_USERNAME = { envVar: 'SIP_USERNAME', jsonPath: 'SIP.username', defaultValue: '' };

E.SIP_PASSWORD = { envVar: 'SIP_PASSWORD', jsonPath: 'SIP.password', defaultValue: '' };

E.SIP_REQUIRE_GOOGLE_AUTH = {
  envVar: 'SIP_REQUIRE_GOOGLE_AUTH', jsonPath: 'SIP.requireGoogleAuth', defaultValue: false, parser: parseBool,
};

E.GOOGLE_CLIENT_ID = { envVar: 'GOOGLE_CLIENT_ID', jsonPath: 'Google.clientId', defaultValue: '' };

E.GOOGLE_HOSTED_DOMAIN = { envVar: 'GOOGLE_HOSTED_DOMAIN', jsonPath: 'Google.hostedDomain', defaultValue: '' };

E.BLACKLIST = { envVar: 'BLACKLIST', jsonPath: 'blacklist', defaultValue: '' };

E.MEDIA_MODE = { envVar: 'MEDIA_MODE', jsonPath: 'mediaMode', defaultValue: 'routed' };

E.APP_NAME = { envVar: 'APP_NAME', jsonPath: 'appName', defaultValue: 'Vonage Video Conferencing' };

E.INTRO_TEXT = { envVar: 'INTRO_TEXT', jsonPath: 'introText', defaultValue: 'Welcome to Video Conferencing.' };

E.INTRO_FOOTER_LINK_TEXT = { envVar: 'INTRO_FOOTER_LINK_TEXT', jsonPath: 'introFooterLinkText', defaultValue: '' };

E.INTRO_FOOTER_LINK_URL = { envVar: 'INTRO_FOOTER_LINK_URL', jsonPath: 'introFooterLinkUrl', defaultValue: '' };

E.HELP_LINK_TEXT_1 = { envVar: 'HELP_LINK_TEXT_1', jsonPath: 'helpLinkText1', defaultValue: '' };

E.HELP_LINK_URL_1 = { envVar: 'HELP_LINK_URL_1', jsonPath: 'helpLinkUrl1', defaultValue: '' };

E.HELP_LINK_TEXT_2 = { envVar: 'HELP_LINK_TEXT_2', jsonPath: 'helpLinkText2', defaultValue: '' };

E.HELP_LINK_URL_2 = { envVar: 'HELP_LINK_URL_2', jsonPath: 'helpLinkUrl2', defaultValue: '' };

E.ADOBE_TRACKING_URL = { envVar: 'ADOBE_TRACKING_URL', jsonPath: 'adobeTracking.url', defaultValue: '' };

E.ADOBE_TRACKING_PRIMARY_CATEGORY = { envVar: 'ADOBE_TRACKING_PRIMARY_CATEGORY', jsonPath: 'adobeTracking.primaryCategory', defaultValue: '' };

E.ADOBE_TRACKING_SITE_IDENTIFIER = { envVar: 'ADOBE_TRACKING_SITE_IDENTIFIER', jsonPath: 'adobeTracking.siteIdentifier', defaultValue: '' };

E.ADOBE_TRACKING_FUNCTION_DEPT = { envVar: 'ADOBE_TRACKING_FUNCTION_DEPT', jsonPath: 'adobeTracking.functionDept', defaultValue: '' };

E.ONE_TRUST_COOKIE_CONSENT_URL = { envVar: 'ONE_TRUST_COOKIE_CONSENT_URL', jsonPath: 'oneTrustCookieConsentUrl', defaultValue: '' };

E.START_BUILDING_ICID = { envVar: 'START_BUILDING_ICID', jsonPath: 'icid.startBuiliding', defaultValue: '' };

E.CONTACT_US_ICID = { envVar: 'CONTACT_US_ICID', jsonPath: 'icid.contactUs', defaultValue: '' };
