![logo](./tokbox-logo.png)

# OpenTokRTC v2
[![Build Status](https://travis-ci.com/opentok/OpenTokRTC-V2.svg?token=qPpN1jG8Wftsn1cafKif&branch=master)](https://travis-ci.com/opentok/OpenTokRTC-V2)

OpenTokRTC is your private web-based video conferencing solution. It is based on TokBox's OpenTok platform and uses OpenTok's SDKs and API. You can deploy OpenTokRTC on your servers to get your own Google Hangouts alternative running on WebRTC.

This repository contains a NodeJS server and a web client application.

## Table of Contents

- [Installation](#installation)
  - [Requirements](#requirements)
  - [Setting up](#setting-up)
- [Running](#running)
- [Configuration options](#configuration-options)
- [Screensharing](#screensharing)
- [Troubleshooting](#troubleshooting)

---

## Installation
If you want to install OpenTokRTC on your own server, read on. If you want to deploy OpenTokRTC to Heroku, see [`INSTALL-heroku.md`](INSTALL-heroku.md).

### Requirements

You will need these dependencies installed on your machine:

- [NodeJS v4+](https://nodejs.org): This version of OpenTokRTC is tested with NodeJS v4 LTS.
- [Redis](https://redis.io): A `redis` server running on `localhost`. Redis is used for storing configuration and session data.
- [Bower](https://bower.io): Used for packaging web client dependencies.
- [Grunt](http://gruntjs.com): Used for bundling assets and running tests.

You will also need these API subscriptions:

- [OpenTok](https://tokbox.com): An OpenTok API key and secret. You can obtain these by signing up with [TokBox](https://tokbox.com).
- [Firebase](https://firebase.google.com)(Optional): A Firebase app and secret. Firebase is used for storing archives of video conferences. You will need this only if you want to enable archiving (recording) of conference rooms.

### Setting up

Once all the dependencies are in place, you will need to set some configuration options in your local Redis server using `redis-cli` and install the applications dependencies.

First, change directory to where you have downloaded OpenTokRTC:

```sh
$ cd <path-to-OpenTokRTC>
```

Ensure that Redis server is running on `localhost`. Once it is up, set these configuration options for TokBox. Replace `<key>` with your OpenTok API key and `<secret>` with the corresponding API secret in these commands:

```sh
$ redis-cli set tb_api_key <key>
$ redis-cli set tb_api_secret <secret>
```

If you want to use archiving, set up Firebase configuration. Replace `<appurl>` with your Firebase application URL and `<appsecret>` with the secret for that Firebase app in these commands:

```sh
$ redis-cli set fb_data_url <appurl>
$ redis-cli set fb_auth_secret <appsecret>
```

For more configuration options, see [detailed configuration options](#configuration-options) below:

Next, set up the dependencies for the server:

```sh
$ npm install
```

Finally, set up the client side dependencies and prepare the assets:

```sh
$ bower install
$ grunt
```

## Running

Start the application by running:

```sh
$ node server
```

This will start the application on port `8123` by default.

To specify a custom port number, use the `-p` flag when calling `node server`, e.g., to run the application on port `8080`:

```sh
$ node server -p 8080
```

Additionally, you can start the application as a daemon by passing `-d` flag, which starts the application and keeps it running in the background so that your terminal is not blocked, e.g.:

```sh
$ node server -d
```

### Detailed usage information

```text
$ node server -h
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

```sh
$ node server -p 8080 -s ./web
```

## Configuration options

These are the detailed configuration options that can be set using `redis-cli`:

### TokBox configuration

- `tb_api_key` (Required): Your OpenTok API key.
- `tb_api_secret` (Required): Your OpenTok API Secret.
- `tb_archive_polling_initial_timeout` (Optional, default value: 5000): Timeout (in milliseconds) for
   polling for archive status change updates. Set this to zero to disable polling. This is the
   initial timeout (timeout for the first poll).
- `tb_archive_polling_multiplier` (Optional, default value: 1.5) : Timeout multiplier. After the first
   poll (if it fails) the next ones will apply this multiplier successively. Set to a lower number
   to poll more often.

### Firebase configuration

- `fb_data_url` (Required): Firebase data URL. This should be the root of the archives section of
   your Firebase app URL, which isn't necessarily the root of the app.
- `fb_auth_secret` (Required): Firebase secret to generate auth tokens.
- `tb_max_session_age` (Optional, default value 2):  Sessions should not live forever. So we'll store
   the last time a session was used and if when we fetch it from Redis we determine it's older than
   this max age (in days). This is the key where that value (in days) should be stored.
   By default, sessions live two days.
- `tb_max_history_lifetime` (Optional, default value 3): Maximum time, in minutes,  an empty room
  will keep it's history (of recordings) alive.

### Additional configuration

- `chrome_extension_id` (Optional, default value: 'undefined'): Chrome AddOn extension Id for sharing
   screen. Note that while the default value allows the server to run it doesn't actually allow
   screen sharing in chrome. For help configuring the screensharing extension see [Screensharing](#screensharing).
- `allow_iframing` (Optional, default value: 'never'): Controls the server-side restriction on
   allowing to load content inside an iframe. The allowed values are:
   - 'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
               to reflect this, this option only changes what the server allows)
   - 'never': Set X-Frame-Options to 'DENY' (so deny from everyone)
   - 'sameorigin': Set X-Frame-Options to 'SAMEORIGIN'
   - We don't allow restricting it to some URIs because it doesn't work on Chrome
- `valid_referers` (Optiona, default value: '[]'): List (JSONified array) of the hosts that can hot
   link to URLs. This same server is always allowed to hot-link


### Firebase security measure

If you want to ensure that the archive list is kept secure (as in only the actual people using a room can see it, and nobody can see the list of archives of other rooms) then you will need to configure additional security parameters to your Firebase application. To do this, log in to Firebase and set this security rule in the "Security & Rules" section:


```js
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

Replace 'sessions' with the root where you want to store the archive data (the actual URL that you set as `fb_data_url` configuration parameter.


## Screensharing
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

## Troubleshooting

Issue: "ServerPersistence: Timeout while connecting to the Persistence Provider! Is Redis running?"<br>
Answer: Ensure Redis server is running on localhost and restart OpenTokRTC.

Issue: OpenTokRTC does not work on when served over `http`.<br>
Answer: Browser security policies require HTTPS for WebRTC. You will need to set up OpenTokRTC to serve over HTTPS. You can set up a [secure reverse-proxy](https://www.nginx.com/resources/admin-guide/nginx-https-upstreams/) to your OpenTokRTC port using nginx. For details, read [this post](https://tokbox.com/blog/the-impact-of-googles-new-chrome-security-policy-on-webrtc/).
