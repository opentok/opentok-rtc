![logo](./tokbox-logo.png)

# OpenTokRTC v2
[![Build Status](https://travis-ci.com/opentok/OpenTokRTC-V2.svg?token=qPpN1jG8Wftsn1cafKif&branch=master)](https://travis-ci.com/opentok/OpenTokRTC-V2)

OpenTokRTC is your private web-based video conferencing solution. It is based on the TokBox
[OpenTok platform](https://tokbox.com/developer/) and uses the OpenTok SDKs and API. You can deploy
OpenTokRTC on your servers to get your own Google Hangouts alternative running on WebRTC.

This repository contains a Node.js server and a web client application.

## Table of Contents

- [Installation](#installation)
  - [Requirements](#requirements)
  - [Setting up](#setting-up)
- [Running](#running)
- [Configuration options](#configuration-options)
  - [OpenTok configuration](#opentok-configuration)
  - [Firebase configuration](#firebase-configuration)
  - [Screen sharing](#screen-sharing)
  - [Web client configuration](#web-client-configuration)
  - [Additional configuration options](#additional-configuration-options)
- [Customizing UI](#customizing-ui)
- [Troubleshooting](#troubleshooting)

---

## Installation

If you want to install OpenTokRTC on your own server, read on. If you want to deploy OpenTokRTC to Heroku, see [`INSTALL-heroku.md`](INSTALL-heroku.md).

### Requirements

You will need these dependencies installed on your machine:

- [NodeJS v4+](https://nodejs.org): This version of OpenTokRTC is tested with NodeJS v4 LTS.
- [Redis](https://redis.io): A `redis` server running on `localhost`.
- [Grunt](http://gruntjs.com): Used for bundling assets and running tests. You can install the Grunt CLI globally by running: `# npm i -g grunt-cli`.

You will also need these API subscriptions:

- [OpenTok](https://tokbox.com): An OpenTok API key and secret. You can obtain these by signing up with [TokBox](https://tokbox.com).
- [Firebase](https://firebase.google.com) (Optional): A Firebase app and secret. Firebase is used for storing archive data of video conferences. You will need this only if you want to enable Archive Management (In-app playback and download of recordings) of conference rooms.

### Setting up

Once all the dependencies are in place, you will need to set some configuration options and install the applications dependencies.

First, change directory to where you have downloaded OpenTokRTC. Then create create the file `config.json` in the `config` folder. You can copy `config/example.json` to `config/config.json`

```sh
$ cd <path-to-OpenTokRTC>
$ cp config/example.json config/config.json
```

### Edit configuration file

Edit `config/config.json` and replace `<key>` and `<secret>` with your OpenTok API key and the corresponding API secret:

```js
{
    "OpenTok": {
        "apiKey": "<key>"
        "apiSecret": "<secret>"
    }
}
```

If you want to use archive management, set up Firebase configuration. To do these, edit the configuration sections for `"Firebase"` and `"Archiving"`. Replace `<firebase_url>` with a Firebase database URL and `<firebase_secret>` with a corresponding database secret. Also mark `Archiving` and `archivingManager` as enabled. For more information on how to obtain Firebase credentials, see [Firebase configuration](#firebase-configuration) section below:

```js
{
    "Firebase": {
        "dataUrl": "<firebase_url>",
        "authSecret": "<firebase_secret>"
    },
    "Archiving": {
        "enabled": true,
        "archiveManager": {
            "enabled": true
        }
    }
}
```

For more configuration options, see [detailed configuration options](#configuration-options) below:

Next, set up the dependencies for the server:

```sh
$ npm install
```

Note: You will need to run these commands as a non-root user, else `bower` will refuse to execute.

## Running

Ensure that Redis server is running on `localhost` (run `redis-server`). Start the application in foreground by running:

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

To start the server with HTTPS enabled, pass `-S` flag to launch a secure server along with `-C <dir>` flag to specify a directory that holds SSL certificate files. To quickly start a secure server, run:

```sh
$ node server -S -C sampleCerts
```

The server expects SSL certificate file to be named  `serverCert.pem` and SSL private key file to be named `serverKey.pem`. There is a pre-generated, self-signed SSL certificate pair in the `./sampleCerts` directory.

For detailed information on available options, run `$ node server -h`.

## Configuration options

Configuration can be done using the config JSON file, or environment variables which overwrite any JSON value read. The default JSON file is `config/config.json`. This path can be overwritten using the Environment Variable `DEFAULT_JSON_CONFIG_PATH`.
These are the detailed configuration options:

### OpenTok configuration

Environment Variable Names and Description:
- `TB_API_KEY` (Required): Your OpenTok API key.
- `TB_API_SECRET` (Required): Your OpenTok API Secret.
- `TB_MAX_SESSION_AGE` (Optional, default value 2):  Sessions should not live forever. So we'll store
   the last time a session was used and if when we fetch it from Redis we determine it's older than
   this max age (in days). This is the key where that value (in days) should be stored.
   By default, sessions live two days.

JSON example:

```json
"OpenTok": {
	"apiKey": "<key>",
	"apiSecret": "<secret>",
	"maxSessionAge": 2,
}
```

### Firebase configuration

This application needs you to specify a Firebase database URL and a database secret. Here is how you can obtain both.

Go to [Firebase console](https://console.firebase.google.com/), create a new project or choose an existing project. Once there, follow these steps:

- **Firebase database URL:** Click on `Database` link on the left. Copy the URL you see under the `Data` tab. The URL is in the format `https://xxxx.firebaseio.com/` where `xxxx` is the unique ID of your Firebase project.

  **Note**: For the security rule mentioned in the [Firebase security measure](#firebase-security-measure) section to work, you will need to set the Firebase database URL in this application configuration as `https://xxxx.firebaseio.com/sessions`.

- **Firebase database secret:** Click on the `Settings` (cog) icon and go to `Project Settings` > `Service Accounts` > `Database Secrets`. Click on the `Show` button for the secret and copy it.

Then set the following values in `config/config.json`, replacing `<firebase_url>` with the Firebase database URL and `<firebase_secret>` with the Firebase database secret:

```json
"Firebase": {
    "dataUrl": "<firebase_url>",
    "authSecret": "<firebase_secret>"
}
```

You can also set the values using these environment variables:

- `FB_DATA_URL`: Firebase database URL.
- `FB_AUTH_SECRET`: Firebase database secret.

#### Firebase security measure

If you want to ensure that the archive list is kept secure (as in only the actual people using a room can see it, and nobody can see the list of archives of other rooms) then you will need to configure additional security parameters to your Firebase application. To do this, log in to Firebase console, go to your project, then in `Database` > `Rules` set these rules and hit `Publish`:

```js
{
    "rules": {
        ".read": "auth != null && auth.role == 'server'",
        ".write": "auth != null && auth.role == 'server'",
        "$sessionId": {
            ".read": "auth != null && (auth.role == 'server' || auth.sessionId == $sessionId)",
            ".write": "auth != null && auth.role == 'server'",
            "archives": {},
            "connections": {
                ".read": "auth != null && auth.role == 'server'",
                ".write": "auth != null && (auth.role == 'server' || auth.sessionId == $sessionId)",
                "$connectionId": {}
            }
        }
    }
}
```

### Screen sharing

The screen-sharing-extension-chrome directory includes sample files for developing a
Chrome extension for enabling screen-sharing for this app. See the
[OpenTok screen sharing developer guide](https://tokbox.com/developer/guides/screen-sharing/js/)
for more information.

Follow these steps to use the chrome extension included in this repository.

1. Edit the `manifest.json` file:

    * Set the `matches` property to match only your web domains. (When developing in
      the localhost environment, you can use ```"matches": ["http://localhost/*"]```).

    * Change the `name` and `author` settings

    * Replace the icon files (logo16.png, logo48.png, logo128.png, and logo128transparent.png)
    with your own website logos.

    * Change the `version` setting with each new version of your extension.

    * You may want to change the `description`.

    For more information, see the [Chrome extension manifest
    documentation](https://developer.chrome.com/extensions/manifest).

2. Load the extension into Chrome:

    Open [chrome://extensions](chrome://extensions) and drag the screen-sharing-extension-chrome
    directory onto the page, or click 'Load unpacked extension...'. For more information see
    [Chrome's documentation on loading unpacked
    extensions](https://developer.chrome.com/extensions/getstarted#unpacked).

3. Add the `extensionId` to application configuration:

   You can get the ID of the extension in the [chrome://extensions](chrome://extensions) page.
   (It looks like `ffngmcfincpecmcgfdpacbdbdlfeeokh`).
   Add the value to the configuration, see [Configuration Options: Screen sharing](#screen-sharing).

For more information and how to use your extension in production see the documentation at the
[opentok/screensharing-extensions](https://github.com/opentok/screensharing-extensions/blob/master/chrome/ScreenSharing/README.md#customizing-the-extension-for-your-website)
repo on GitHub.

### Web client configuration

Web client allows to be configured in some of its features. You can enable or disable using their `enabled` field in JSON or `ENABLE_<FEATURE>` environment variable.

#### Archiving

- `ENABLE_ARCHIVING`:(Optional, default value: true) Enable Archiving (Recording)
- `ARCHIVE_ALWAYS`:(Optional, default value: false) Record all sessions.
- `ARCHIVE_TIMEOUT`: (Optional, default value: 5000): The initial polling timeout (in milliseconds) for archive status change updates. Set this to 0 to disable polling.
- `TIMEOUT_MULTIPLIER` (Optional, default value: 1.5) : Timeout multiplier. If the first archive status update polling fails, subsequent polling intervals will apply this multiplier
   successively. Set to a lower number to poll more often.

##### Archive Manager

- `ENABLE_ARCHIVE_MANAGER`: (Optional, default value: false) Enable Archive Manager. Only meaningful if `archiving` is not disabled (Manage Recordings, requires firebase to be configured)
- `EMPTY_ROOM_LIFETIME`: (Optional, default value 3): Maximum time, in minutes,  an empty room

```json
"Archiving": {
    "enabled": true,
    "archiveAlways": false,
    "pollingInitialTimeout": 5000,
    "pollingTimeoutMultiplier": 1.5,
    "archiveManager": {
        "enabled": false,
        "emptyRoomMaxLifetime": 3
    }
},
```

#### Screen sharing configuration

- `ENABLE_SCREENSHARING`:(Optional, default value: false) Whether to enable screen sharing.
- `CHROME_EXTENSION_ID` (Optional, default value: 'null'): The Chrome AddOn extension ID for screen sharing. Note that while the default value allows the server to run, it doesn't actually enable screen sharing in Chrome. See [Screen sharing](#screen-sharing).
- `ENABLE_ANNOTATIONS`: (Optional, default value: true) Whether to enable annotations in screen sharing. This is only meaningful if screen sharing is not disabled.

```json
"Screensharing": {
    "enabled": false,
    "chromeExtensionId": null,
    "annotations": {
        "enabled": true
    }
}
```

To know more about how screen sharing works in OpenTok, see the [guide on screen
sharing](tokbox.com/developer/guides/screen-sharing/).

#### Feedback

 `ENABLE_FEEDBACK`: Enable the "Give Demo Feedback" form.

 ```json
 "Feedback": {
     "enabled": false
 },
 ```

### Additional configuration options

* `ALLOW_IFRAMING` (Optional, default value: 'never'): Controls the server-side restriction on
   allowing content to load inside an iframe. The allowed values are:

   - 'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
     to reflect this, this option only changes what the server allows)

   - 'never': Set X-Frame-Options to 'DENY' (Deny loading content in any iframe)

   - 'sameorigin': Set X-Frame-Options to 'SAMEORIGIN' (Only allow iframe content to be loaded
     from pages in the same origin)

   We don't allow restricting iframe loading to specific URIs because it doesn't work on Chrome

## Customizing UI

For information on how to customize OpenTokRTC's UI, see [CUSTOMIZING-UI.md](CUSTOMIZING-UI.md).

## Troubleshooting

**"ServerPersistence: Timeout while connecting to the Persistence Provider! Is Redis running?**

Ensure Redis server is running on localhost (run `redis-server` in the command line)
and restart OpenTokRTC.

**OpenTokRTC does not work on when served over HTTP.**

Browser security policies require HTTPS for WebRTC video communications. You will need to set up
the app to be served over HTTPS. You can set up a
[secure reverse-proxy](https://www.nginx.com/resources/admin-guide/nginx-https-upstreams/)
to your OpenTokRTC port using nginx. For details, read
[this post](https://tokbox.com/blog/the-impact-of-googles-new-chrome-security-policy-on-webrtc/).

**UI looks broken**

UI assets are compiled as part of the build process when installing application dependencies using `npm install`. If the web application UI still looks broken, run the following commands in the root directory of the application:

```
$ bower install
$ grunt clientBuild
```

We recommend that you run the application as a non-root user. Howerver, if you are running the application as the `root` user, you will additionally need to tell `bower` to allow root user to install dependencies, else bower will refuse to work:

```
$ bower install --allow-root
```
