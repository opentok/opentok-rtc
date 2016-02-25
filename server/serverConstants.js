// Just to have all the useful constants on a single place.

'use strict';

var E = module.exports;
var env = process.env;

const PREFIX = 'OTRTC__';

E.DEFAULT_USER_NAME = 'Anonymous User';

// Some Redis keys...
// OpenTok API key:
E.RED_TB_API_KEY = 'tb_api_key';

// Timeout (in milliseconds) for polling for archive status change updates. Set this to zero
// to disable polling. This is the initial timeout (timeout for the first poll).
E.RED_TB_ARCHIVE_POLLING_INITIAL_TIMEOUT = 'tb_archive_polling_initial_timeout';
// Timeout multiplier. After the first poll (if it fails) the next one will apply this multiplier
// successively. Set to a lower number to poll often.
E.RED_TB_ARCHIVE_POLLING_TIMEOUT_MULTIPLIER = 'tb_archive_polling_multiplier';

// OpenTok API Secret
E.RED_TB_API_SECRET ='tb_api_secret';

// Firebase data URL. This should be the root of the archives section of your Firebase app URL,
// which isn't necessarily the root of the app.
E.RED_FB_DATA_URL = 'fb_data_url';

// Firebase secret to generate auth tokens
E.RED_FB_AUTH_SECRET = 'fb_auth_secret';

// Sessions should not live forever. So we'll store the last time a session was used and if when
// we fetch it from Redis we determine it's older than this max age (in days). This is the key
// where that value (in days) should be stored. By default, sessions live two days.
E.RED_TB_MAX_SESSION_AGE = 'tb_max_session_age';

// Maximum time an empty room will keep it's history alive, in minutes.
E.RED_EMPTY_ROOM_MAX_LIFETIME = 'tb_max_history_lifetime';

// Chrome AddOn extension Id for sharing screen
E.RED_CHROME_EXTENSION_ID = 'chrome_extension_id';

// Do we want to allow being used inside an iframe?
// This can be:
//  'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
//        to reflect this, this option only changes what the server allows)
//  'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
//  'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
// We don't allow restricting it to some URIs because it doesn't work on Chrome
E.RED_ALLOW_IFRAMING = 'allow_iframing';

// A prefix for the room sessionInfo (sessionId + timestamp + inProgressArchiveId).
// inProgressArchiveId will be present (and not undefined) only if there's an archive
// operation running on that session.
// Also note that while we don't actually need to store the in-progress archive operation
// (and in fact it would be more robust if we didn't!) because we can just call listArchives
// to get that, it's more efficient if we cache it locally.
E.RED_ROOM_PREFIX = 'otrtc_room__';
E.RED_ROOM_MATCHES = E.RED_ROOM_PREFIX + '*';

E.REDIS_KEYS = [
  { key: E.RED_TB_API_KEY, defaultValue: env.TB_API_KEY || null },
  { key: E.RED_TB_API_SECRET, defaultValue: env.TB_API_SECRET || null },
  { key: E.RED_TB_ARCHIVE_POLLING_INITIAL_TIMEOUT, defaultValue: env.ARCHIVE_TIMEOUT || 5000 },
  { key: E.RED_TB_ARCHIVE_POLLING_TIMEOUT_MULTIPLIER, defaultValue: env.TIMEOUT_MULTIPLIER || 1.5 },
  { key: E.RED_FB_DATA_URL, defaultValue: env.FB_DATA_URL || null },
  { key: E.RED_FB_AUTH_SECRET, defaultValue: env.FB_AUTH_SECRET || null },
  { key: E.RED_TB_MAX_SESSION_AGE, defaultValue: env.TB_MAX_SESSION_AGE || 2 },
  { key: E.RED_EMPTY_ROOM_MAX_LIFETIME, defaultValue: env.EMPTY_ROOM_LIFETIME || 3 },
  { key: E.RED_ALLOW_IFRAMING, defaultValue: env.ALLOW_IFRAMING || 'never' },
  { key: E.RED_CHROME_EXTENSION_ID, defaultValue: env.CHROME_EXTENSION_ID || 'undefined' }
];
