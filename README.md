# opentokRTCV2:
#### Showcase application for the OpenTok API.
## Introduction

This repository holds a complete demo application for the OpenTok API.

(TO-DO TO-DO: Add OpenTok reference URLS)

The repository includes a complete client application, and the server
needed to access the OpenTok functionality. You can access a demo
installation at https://opentokrtc.com (TO-DO TO-DO: Fix this!)

## Installation

### Local Installation:
#### Prerequisites:
You'll need:

- NodeJS: https://nodejs.org/en/. You can install it with nvm. You'll
  need version 4.0.0 or newer of Node.
  https://github.com/creationix/nvm/.
- Redis: http://redis.io.
- An active OpenTok account on https://tokbox.com/developer/. You'll
  need the API Key and secret, which you can get from
  https://dashboard.tokbox.com/ once you've created the account.
- Bower: http://bower.io
- Grunt: http://gruntjs.com (only if you intend to develop or run the tests)

#### Installation:
Execute

```
redis-cli set tb_api_key yourkeyhere
redis-cli set tb_api_secret yoursecrethere
redis-cli set fb_data_url yourfirebaseappurlhere
redis-cli set fb_auth_secret yourfirebasesecrethere
npm install
bower install
grunt
```

(replace yourkeyhere and yoursecret here with the API key and API
secret).


#### Configuration parameters:

You can customize the behavior of the server in part by using persistent parameters (stored in
redis). The supported parameters and their default values are:

- tb_api_key (*Mandatory*): Your OpenTok API key.
- tb_api_secret (*Mandatory*): Your OpenTok API Secret.
- tb_archive_polling_initial_timeout (Optional, default value: 5000): Timeout (in milliseconds) for
   polling for archive status change updates. Set this to zero to disable polling. This is the
   initial timeout (timeout for the first poll).
- tb_archive_polling_multiplier (Optional, default value: 1.5) : Timeout multiplier. After the first
   poll (if it fails) the next ones will apply this multiplier successively. Set to a lower number
   to poll more often.
- fb_data_url (*Mandatory*): Firebase data URL. This should be the root of the archives section of
   your Firebase app URL, which isn't necessarily the root of the app.
- fb_auth_secret (*Mandatory*): Firebase secret to generate auth tokens.
- tb_max_session_age (Optional, default value 2):  Sessions should not live forever. So we'll store
   the last time a session was used and if when we fetch it from Redis we determine it's older than
   this max age (in days). This is the key where that value (in days) should be stored.
   By default, sessions live two days.
- tb_max_history_lifetime (Optional, default value 3): Maximum time, in minutes,  an empty room
  will keep it's history (of recordings) alive.
- chrome_extension_id (Optional, default value: 'undefined'): Chrome AddOn extension Id for sharing
   screen. Note that while the default value allows the server to run it doesn't actually allow
   screen sharing in chrome.
- allow_iframing (Optional, default value: 'never'): Controls the server-side restriction on
   allowing to load content inside an iframe. The allowed values are:
   - 'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
               to reflect this, this option only changes what the server allows)
   - 'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
   - 'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
   - We don't allow restricting it to some URIs because it doesn't work on Chrome
- valid_referers (Optiona, default value: '[]'): List (JSONified array) of the hosts that can hot
   link to URLs. This same server is always allowed to hot-link

### Installing on Heroku
The application is prepared to run on Heroku, but the configuration differs slightly from the one
required to run It requires having some redis service as an addon. Currently it detects and supports
the following redis services:

 - Heroku-redis: https://devcenter.heroku.com/articles/heroku-redis
 - Redis-to-go: https://elements.heroku.com/addons/redistogo

#### Requirements:
You have to own a validated Heroku account (with the ability to use free addons).

#### Installation:

You have to set the following environment variables on your heroku instance:
 - TB_API_KEY: Your Opentok api key.
 - TB_API_SECRET: Your Opentok api secret.
 - FB_DATA_URL: A firebase URL to store the archive list for each room. If you don't want to use
    this functionality, use any valor (like http://localhost for example)
 - FB_AUTH_SECRET: The authentication secret for the previous URL. If you don't want to use this
   functionality, pass any value (like anyvalue for example).

Execute:
```
heroku create
heroku config:set TB_API_KEY='yourkey' TB_API_SECRET='yoursecret'
heroku config:set FB_DATA_URL='yourfburl' FB_AUTH_SECRET='yourfb_secret'

```

If you want to set up your redis instance, the instruction for setting up a heroku-redis addon are:

```
heroku plugins:install heroku-redis
heroku addons:create heroku-redis:hobby-dev
```

Additionally you can also modify all the other configuration options described previously using
environment variables:

- tb_archive_polling_initial_timeout => ARCHIVE_TIMEOUT
- tb_archive_polling_multiplier => TIMEOUT_MULTIPLIER
- tb_max_session_age => TB_MAX_SESSION_AGE
- tb_max_history_lifetime => EMPTY_ROOM_LIFETIME
- allow_iframing => ALLOW_IFRAMING
- valid_refrers => VALID_REFERERS
- chrome_extension_id => CHROME_EXTENSION_ID

TO-DO: TO-DO: TO-DO:

**** Add deploy button **** To add a deploy button correctly we can do it directly from the Tokbox
dashboard (since we can get the api key and secret from there).

## Running

```
Usage: node server

  -h, --help            Displays this help
  -d, --daemon          Starts as a daemon
  -u, --user=ARG        UID (name or number) to fork to after binding the port
  -p, --serverPort=ARG  Server listening port
  -s, --staticPath=ARG  Directory that holds the static files
  -C, --certDir=ARG     Directory that holds the cert.pem and key.pem files
  -S, --secure          Starts as a secure server (HTTPS)
```
For example:

```
node server -p 8080 -s ./web
```

where:

- listening port: Is the port where the server will listen. By default
  it listens on the port 8123.
- static files directory: Filw where the web files reside. By default
  it's ./web.

## Firebase security

The application uses Firebase to store and share the archive list that's done on a given
room/session. You can activate this feature by setting a valid Firebase URL and secret. If you want
to ensure that the archive list is kept secure (as in only the actual people using a room can see
it, and nobody can see the list of archives of other rooms) then you must add something like:


```
{
    "rules": {
        ".read": false,
        ".write": false,
        "sessions": {
          ".read": "auth != null && auth.role == 'server'",
          ".write": "auth != null && auth.role == 'server'",
          "$sessionId": {
            ".read": "auth != null && (auth.role == 'server' || auth.sessionId == $sessionId)",
            ".write": "auth != null && auth.role == 'server'",
            "archives": {
            },
            "connections": {
              ".read": "auth != null && auth.role == 'server'",
              ".write": "auth != null && (auth.role == 'server' || auth.sessionId == $sessionId)",
              "$connectionId": {
              }
            }
          }
        }
    }
}
```

as a security rule on the Security & Rules section of your Firebase application. Replace 'sessions'
with the root where you want to store the archive data (the actual URL that you set as fb_data_url
configuration parameter.
