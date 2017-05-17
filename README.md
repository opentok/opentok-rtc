![logo](./tokbox-logo.png)

# opentokRTCV2:
[![Build Status](https://travis-ci.com/opentok/OpenTokRTC-V2.svg?token=qPpN1jG8Wftsn1cafKif&branch=master)](https://travis-ci.com/opentok/OpenTokRTC-V2)

#### Showcase application for the OpenTok API.
## Introduction

This repository holds a complete demo application for the OpenTok API.

The repository includes a complete client application, and the server
needed to access the OpenTok functionality. You can access a demo
installation at https://opentokdemo.tokbox.com

## Installation
The steps below detail two methods of setting up an instance of the application. You may choose to set it up [locally](#local-installation) on your machine, or quickly deploy it to an instance on [Heroku](#installing-on-heroku).

### Local Installation:
#### Prerequisites:
You'll need:

- NodeJS: https://nodejs.org/. This application is tested and supported on  v4 LTS.
  If you use [nvm](https://github.com/creationix/nvm/) to manage your node
  installations (recommended), you can run `nvm use` in the project directory to
  select the right version.
- Redis: http://redis.io.
- An active OpenTok account on https://tokbox.com/developer/. You'll
  need the API Key and secret, which you can get from
  https://dashboard.tokbox.com/ once you've created the account.
- Bower: http://bower.io
- Grunt: http://gruntjs.com (only if you intend to develop or run the tests)

#### Installation:
You will need your OpenTok API Key and Secret from the [developer dashboard](https://tokbox.com/account/#/).
Substitute your key and secret into the snippet below and execute.

```
redis-cli set tb_api_key yourkeyhere
redis-cli set tb_api_secret yoursecrethere
redis-cli set fb_data_url yourfirebaseappurlhere
redis-cli set fb_auth_secret yourfirebasesecrethere
npm install
bower install
grunt
```
To run the application follow the instructions in [Running](#running)

#### Configuring the server

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

#### Configuring the client

Web client allows to be configured in some of its features. You can disable feature by adding them to `DISABLED_FEATURES` environment variable or by setting `disabled_features` key in redis.

If you want to have the client with all the features enabled you should execute
```
redis-cli set disabled_features none
```

On the other hand, if you want to disable some of them, set the redis key to their values sepparated by commas like this example:

```
redis-cli set disabled_features annotations, archiving
```

### Installing on Heroku

Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free.
#### Requirements:
You will need a validated Heroku account (with the ability to use free add-ons). You can read about account verification in [this Heroku Article](https://devcenter.heroku.com/articles/account-verification). (Verification is needed as the application uses the [Heroku-redis service](https://devcenter.heroku.com/articles/heroku-redis)).

#### Quick Installation
Once you have verified your account just click this button

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/opentok/OpenTokRTC-V2)

Heroku will prompt you to add your OpenTok API key and OpenTok API secret, which you can
obtain at the [TokBox Dashboard](https://dashboard.tokbox.com/keys).

You can also install this repository on your own server (see the previous sections).

If you prefer to deploy to Heroku manually, see the following section.

#### Manual Installation using Heroku CLI:
For information on downloading and using the heroku CLI see their official documentation: https://devcenter.heroku.com/articles/heroku-cli

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
You will need to choose a redis addon. These two are currently supported,
 - Heroku-redis: https://devcenter.heroku.com/articles/heroku-redis
 - Redis-to-go: https://elements.heroku.com/addons/redistogo


 We have used heroku-redis which can be set up like this:
```
heroku plugins:install heroku-redis
heroku addons:create heroku-redis:hobby-dev
```
You can deploy your code using git: https://devcenter.heroku.com/articles/git#deploying-code

Additionally you can also modify all the other configuration options described previously using
environment variables:

- tb_archive_polling_initial_timeout => ARCHIVE_TIMEOUT
- tb_archive_polling_multiplier => TIMEOUT_MULTIPLIER
- tb_max_session_age => TB_MAX_SESSION_AGE
- tb_max_history_lifetime => EMPTY_ROOM_LIFETIME
- allow_iframing => ALLOW_IFRAMING
- valid_refrers => VALID_REFERERS
- chrome_extension_id => CHROME_EXTENSION_ID

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

## Screenshare extension
The screen sharing extension included in this repository is for Chrome.
You can read the tokbox general guide for screen sharing on different browsers in the [tokbox developer center](https://tokbox.com/developer/guides/screen-sharing/js/).

### Chrome Screensharing Extension
Follow these steps to use the chrome extension included in this repository.
1. Edit the `manifest.json` file:

    Most importantly, ensure that `matches` is set to your own domains only, (when developing in local you can use ```"matches": ["http://localhost/*"]```).

    You will also want to change the `name` and `author` settings, and replace the icon files (logo16.png, logo48.png, logo128.png, and logo128transparent.png) with your own website logos. You should change the `version` setting with each new version of your extension. And you may want to change the `description`. For more information, see the [Chrome extension manifest documentation](https://developer.chrome.com/extensions/manifest).

2. Load the extension into Chrome:

    Open [chrome://extensions](chrome://extensions) and drag the screen-sharing-extension-chrome directory onto the page, or click 'Load unpacked extension...'. For more information see [Chrome's documentation on loading unpacked
    extensions](https://developer.chrome.com/extensions/getstarted#unpacked).

3. Add the `extensionId` to redis as `chrome_extension_id`:

 You can get the ID of the extension in the [chrome://extensions](chrome://extensions) page. (It looks like `ffngmcfincpecmcgfdpacbdbdlfeeokh`.)
 Set the value in redis e.g.
    ```
    redis-cli set chrome_extension_id ffngmcfincpecmcgfdpacbdbdlfeeokh```


For more information and how to use your extension in production see  [opentok/screensharing-extensions](https://github.com/opentok/screensharing-extensions/blob/master/chrome/ScreenSharing/README.md#customizing-the-extension-for-your-website).
