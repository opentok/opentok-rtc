// Just to have all the useful constants on a single place.

'use strict';

var _ = require('lodash');
var E = module.exports;
var env = process.env;
let config;

function throwError(message) {
    throw new Error(message)
}

try {
    var config_file = env.OTDEMO_CONFIG_FILE_PATH || './config.json'
    config = require(config_file)
} catch (e) {
    console.log('No config.json file found.')
    config = {}
}

// json config will be boolean but if environment override will be string
function parseBool(input){
    return (input === true || input === 'true');
}

const PREFIX = 'OTRTC__';

E.DEFAULT_USER_NAME = 'Anonymous User';

// A prefix for the room sessionInfo (sessionId + timestamp + inProgressArchiveId).
// inProgressArchiveId will be present (and not undefined) only if there's an archive
// operation running on that session.
// Also note that while we don't actually need to store the in-progress archive operation
// (and in fact it would be more robust if we didn't!) because we can just call listArchives
// to get that, it's more efficient if we cache it locally.
E.REDIS_ROOM_PREFIX = 'otrtc_room__';

E.REDIS_ROOM_MATCHES = E.REDIS_ROOM_PREFIX + '*';
E.OPENTOK_API_KEY = env.TB_API_KEY || _.get(config,'OpenTok.api_key') || throwError('OpenTok API Key Required');

E.OPENTOK_API_SECRET = env.TB_API_SECRET || _.get(config,'OpenTok.api_secret') || throwError('OpenTok API Secret Required');

E.FIREBASE_DATA_URL = env.FB_DATA_URL || _.get(config,'Firebase.data_url');

E.FIREBASE_AUTH_SECRET = env.FB_AUTH_SECRET || _.get(config,'Firebase.auth_secret');

// Sessions should not live forever. So we'll store the last time a session was used and if when
// we fetch it from Redis we determine it's older than this max age (in days). This is the key
// where that value (in days) should be stored. By default, sessions live two days.
E.OPENTOK_MAX_SESSION_AGE = parseInt(env.TB_MAX_SESSION_AGE || _.get(config,'OpenTok.max_session_age', 2));

E.ENABLE_ARCHIVING = parseBool(env.ENABLE_ARCHIVING || _.get(config,'Archiving.enabled', true));

E.ARCHIVE_ALWAYS = parseBool(env.ARCHIVE_ALWAYS || _.get(config,'Archiving.archive_always', false));

// Timeout (in milliseconds) for polling for archive status change updates. Set this to zero
// to disable polling. This is the initial timeout (timeout for the first poll).
E.ARCHIVE_POLLING_INITIAL_TIMEOUT = parseInt(env.ARCHIVE_TIMEOUT || _.get(config,'Archiving.polling_initial_timeout', 5000));

// Timeout multiplier. After the first poll (if it fails) the next one will apply this multiplier
// successively. Set to a lower number to poll often.
E.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER = parseFloat(env.TIMEOUT_MULTIPLIER || _.get(config,'Archiving.polling_timeout_multiplier', 1.5));

E.ENABLE_ARCHIVE_MANAGER = parseBool(env.ENABLE_ARCHIVE_MANAGER || _.get(config,'Archiving.archive_manager.enabled', false));

// Maximum time an empty room will keep it's history alive, in minutes.
E.EMPTY_ROOM_LIFETIME = env.EMPTY_ROOM_LIFETIME || _.get(config,'Archiving.archive_manager.empty_room_max_lifetime', 3);

E.ENABLE_FEEDBACK = parseBool(env.ENABLE_FEEDBACK || _.get(config,'Feedback.enabled', false));

E.ENABLE_SCREENSHARING = parseBool(env.ENABLE_SCREENSHARING || _.get(config,'Screensharing.enabled', false));

// Chrome AddOn extension Id for sharing screen
E.CHROME_EXTENSION_ID = env.CHROME_EXTENSION_ID || _.get(config,'Screensharing.chrome_extension_id');

E.ENABLE_ANNOTATIONS = parseBool(env.ENABLE_ANNOTATIONS || _.get(config,'Screensharing.annotations.enabled', true));

// Do we want to allow being used inside an iframe?
// This can be:
//  'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
//        to reflect this, this option only changes what the server allows)
//  'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
//  'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
// We don't allow restricting it to some URIs because it doesn't work on Chrome
E.ALLOW_IFRAMING = env.ALLOW_IFRAMING || _.get(config,'allow_iframing', 'never');


E.DEFAULT_TEMPLATE = env.DEFAULT_TEMPLATE || _.get(config,'default_template', 'room');

E.TEMPLATING_SECRET = env.TEMPLATING_SECRET || _.get(config,'templating_secret');


E.IOS_APP_ID =  env.IOS_APP_ID || _.get(config,'IOS_app_id');

E.IOS_URL_PREFIX = env.IOS_URL_PREFIX || _.get(config,'IOS_url_prefix', '');

E.DEFAULT_INDEX_PAGE = env.DEFAULT_INDEX_PAGE || _.get(config,'default_index_page', undefined);
