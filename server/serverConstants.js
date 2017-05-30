// Just to have all the useful constants on a single place.

'use strict';

var E = module.exports;
var env = process.env;
let config;

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

E.OPENTOK_API_KEY = { envVar: 'TB_API_KEY', jsonPath: 'OpenTok.api_key', required: true}

E.OPENTOK_API_SECRET = { envVar: 'TB_API_SECRET', jsonPath: 'OpenTok.api_secret', required: true};

E.FIREBASE_DATA_URL = { envVar: 'FB_DATA_URL', jsonPath: 'Firebase.data_url' };

E.FIREBASE_AUTH_SECRET = { envVar: 'FB_AUTH_SECRET', jsonPath: 'Firebase.auth_secret' };

// Sessions should not live forever. So we'll store the last time a session was used and if when
// we fetch it from Redis we determine it's older than this max age (in days). This is the key
// where that value (in days) should be stored. By default, sessions live two days.
E.OPENTOK_MAX_SESSION_AGE = { envVar: 'TB_MAX_SESSION_AGE', jsonPath: 'OpenTok.max_session_age', defaultValue: 2, parser: parseInt };

E.ENABLE_ARCHIVING = { envVar: 'ENABLE_ARCHIVING', jsonPath: 'Archiving.enabled', defaultValue: true, parser: parseBool };

E.ARCHIVE_ALWAYS = { envVar: 'ARCHIVE_ALWAYS', jsonPath: 'Archiving.archive_always', defaultValue: false, parser: parseBool };

// Timeout (in milliseconds) for polling for archive status change updates. Set this to zero
// to disable polling. This is the initial timeout (timeout for the first poll).
E.ARCHIVE_POLLING_INITIAL_TIMEOUT = { envVar: 'ARCHIVE_TIMEOUT', jsonPath: 'Archiving.polling_initial_timeout', defaultValue:  5000, parser: parseInt };

// Timeout multiplier. After the first poll (if it fails) the next one will apply this multiplier
// successively. Set to a lower number to poll often.
E.ARCHIVE_POLLING_TIMEOUT_MULTIPLIER = { envVar: 'TIMEOUT_MULTIPLIER', jsonPath: 'Archiving.polling_timeout_multiplier', defaultValue: 1.5, parser: parseFloat };

E.ENABLE_ARCHIVE_MANAGER = { envVar: 'ENABLE_ARCHIVE_MANAGER', jsonPath: 'Archiving.archive_manager.enabled', defaultValue: false, parser: parseBool };

// Maximum time an empty room will keep it's history alive, in minutes.
E.EMPTY_ROOM_LIFETIME = { envVar: 'EMPTY_ROOM_LIFETIME', jsonPath: 'Archiving.archive_manager.empty_room_max_lifetime', defaultValue: 3 };

E.ENABLE_FEEDBACK = { envVar: 'ENABLE_FEEDBACK', jsonPath: 'Feedback.enabled', defaultValue: false, parser: parseBool };


E.ENABLE_SCREENSHARING = { envVar: 'ENABLE_SCREENSHARING', jsonPath: 'Screensharing.enabled', defaultValue: false, parser: parseBool };


// Chrome AddOn extension Id for sharing screen
E.CHROME_EXTENSION_ID = { envVar: 'CHROME_EXTENSION_ID', jsonPath: 'Screensharing.chrome_extension_id' };

E.ENABLE_ANNOTATIONS = { envVar: 'ENABLE_ANNOTATIONS', jsonPath: 'Screensharing.annotations.enabled', defaultValue: true, parser: parseBool };


// Do we want to allow being used inside an iframe?
// This can be:
//  'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
//        to reflect this, this option only changes what the server allows)
//  'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
//  'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
// We don't allow restricting it to some URIs because it doesn't work on Chrome
E.ALLOW_IFRAMING = { envVar: 'ALLOW_IFRAMING', jsonPath: 'allow_iframing', defaultValue: 'never' };


E.DEFAULT_TEMPLATE = { envVar: 'DEFAULT_TEMPLATE', jsonPath: 'default_template', defaultValue: 'room' };

E.TEMPLATING_SECRET = { envVar: 'TEMPLATING_SECRET', jsonPath: 'defaultValue: templating_secret' };

E.IOS_APP_ID =  { envVar: 'IOS_APP_ID', jsonPath: 'IOS_app_id' };

E.IOS_URL_PREFIX = { envVar: 'IOS_URL_PREFIX', jsonPath: 'IOS_url_prefix', defaultValue: '' };

E.DEFAULT_INDEX_PAGE = { envVar: 'DEFAULT_INDEX_PAGE', jsonPath: 'default_index_page', defaultValue: undefined };
