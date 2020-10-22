# OpenTokRTC

<img src="https://assets.tokbox.com/img/vonage/Vonage_VideoAPI_black.svg" height="48px" alt="Tokbox is now known as Vonage" />

[![Build Status](https://travis-ci.com/opentok/opentok-rtc.svg?token=qPpN1jG8Wftsn1cafKif&branch=master)](https://travis-ci.com/opentok/opentok-rtc)
[![codecov](https://codecov.io/gh/opentok/opentok-rtc/branch/master/graph/badge.svg)](https://codecov.io/gh/opentok/opentok-rtc/branch/master)

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
  - [Screen sharing](#screen-sharing)
  - [Phone dial-out](#phone-dial-out)
  - [Google Authentication for Phone dial-out](#google-authentication-for-phone-dial-out)
  - [Web client configuration](#web-client-configuration)
  - [Additional configuration options](#additional-configuration-options)
- [Customizing the UI](#customizing-the-ui)
- [Troubleshooting](#troubleshooting)
- [Health status check](#health-status-check)

---

## Installation

If you want to install OpenTokRTC on your own server, read on. If you want to deploy OpenTokRTC to Heroku, see [`INSTALL-heroku.md`](INSTALL-heroku.md).

### Requirements

You will need these dependencies installed on your machine:

- [NodeJS v12](https://nodejs.org): This version of OpenTokRTC is tested with NodeJS v12 LTS.
- [Redis](https://redis.io): A `redis` server running on `localhost`.
- [Grunt](http://gruntjs.com): Used for bundling assets and running tests. You can install the Grunt CLI globally by running:<br/>   `# npm i -g grunt-cli`.

You will also need these API subscriptions:

- [OpenTok](https://tokbox.com): An OpenTok API key and secret. You can obtain these by signing up with [Opentok/Vonage](https://tokbox.com/account/user/signup).

### Setting up

Once all the dependencies are in place, you will need to set some configuration options and install the applications dependencies.

First, change directory to where you have downloaded OpenTokRTC. Then create create the file `config.json` in the `config` folder. You can copy `config/example.json` to `config/config.json`

```sh
$ cd <path-to-opentok-rtc>
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

If you want to use archive management, Mark `Archiving` and `archivingManager` as enabled.

```js
{
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

The server expects SSL certificate file to be named `serverCert.pem` and SSL private key file to be named `serverKey.pem`. There is a pre-generated, self-signed SSL certificate pair in the `./sampleCerts` directory.

For detailed information on available options, run `$ node server -h`.

## Configuration options

Configuration can be done using the config JSON file, or environment variables which overwrite any JSON value read. The default JSON file is `config/config.json`. This path can be overwritten using the Environment Variable `DEFAULT_JSON_CONFIG_PATH`.
These are the detailed configuration options:

### OpenTok configuration

Environment Variable Names and Description:

- `TB_API_KEY` (Required): Your OpenTok API key.
- `TB_API_SECRET` (Required): Your OpenTok API Secret.
- `PUBLISHER_RESOLUTION` (Optional): Desired resolution for publishers.
- `TB_JS_URL` (Optional): The OpenTok.js URL to be loaded by the app. The default value is
  "https://static.opentok.com/v2/js/opentok.min.js". Enterprise partners should set this to the URL
  for the enterprise version of OpenTok.js ("https://enterprise.opentok.com/v2/js/opentok.min.js").
- `TB_MAX_SESSION_AGE` (Optional, default value 2): Sessions should not live forever. So we'll store
  the last time a session was used and if when we fetch it from Redis we determine it's older than
  this max age (in days). This is the key where that value (in days) should be stored.
  By default, sessions live two days.

JSON example:

```json
"OpenTok": {
  "apiKey": "<key>",
  "apiSecret": "<secret>",
  "publisherResolution": "640x480",
  "jsUrl": "https://static.opentok.com/v2/js/opentok.min.js",
  "maxSessionAge": 2
}
```

### Phone dial-out

The app can dial out and add a phone-based end user to the OpenTok session, using the OpenTok
[SIP API](https://tokbox.com/developer/rest/#sip_call). This app uses
[Nexmo](https://www.nexmo.com/) as the SIP application that connects
to OpenTok. (You can also use the OpenTok SIP API to connect to other SIP endpoints.)

To enable this feature:

1. Sign up for a [Nexmo/Vonage](https://dashboard.nexmo.com/sign-up) account.

2. Edit config/config.json file in this application, and add the following properties:

- `SIP.enabled` -- Set this to `true`.

- `SIP.username` -- Set this to the apiKey for the Nexmo account you created.

- `SIP.password` -- Set this to the apiSecret for the Nexmo account you created.

- `SIP.requireGoogleAuth` -- See [Google Authentication for Phone dial-out](#google-authentication-for-phone-dial-out) for instructions on how to limit this functionality to users authenticated by their google account.

For example, the new lines in the config.json file should look like this:

```json
       "SIP": {
         "sipUri" : "sip:phoneumber@sip.nexmo.com",
         "sipUsername" : "nexmoApiKey",
         "sipPassword" : "nexmoApiSecret",
         "requireGoogleAuth": false
       }
```

You can also add these settings as `SIP_ENABLED`, `SIP_URL`, `SIP_USERNAME`, `SIP_PASSWORD` and `SIP_REQUIRE_GOOGLE_AUTH` environment variables (instead of config.json settings).

#### Google Authentication for Phone dial-out

You can limit the ability to place outgoing calls to those authenticated by google.
To enable this feature:

1. Create a Google API Console Project and client ID following the steps detailed here: https://developers.google.com/identity/sign-in/web/devconsole-project

2. Edit the config/config.json file in this application, and add the following properties:

- `Google.clientId` -- Set this to your client ID.
- `Google.hostedDomain` -- If you wish to limit sign in to accounts associated with a hosted domain, set the domain here.
- `Sip.requireGoogleAuth` -- `true` to require auth for SIP dial-out as detailed in [Phone dial-out](#phone-dial-out).

For example, the new lines in the config.json file should look like this:

```json
  "Google": {
    "clientId": "yourClientId.apps.googleusercontent.com>",
    "hostedDomain": "yourhosteddomain.com"
  }
```

You can also add these as `GOOGLE_CLIENT_ID` and `GOOGLE_HOSTED_DOMAIN` environment variables instead of config.json setings.

### Web client configuration

Web client allows to be configured in some of its features. You can enable or disable using their `enabled` field in JSON or `ENABLE_<FEATURE>` environment variable.

#### Archiving

- `ENABLE_ARCHIVING`:(Optional, default value: true) Enable Archiving (Recording)
- `ARCHIVE_ALWAYS`:(Optional, default value: false) Record all sessions.
- `ARCHIVE_TIMEOUT`: (Optional, default value: 5000): The initial polling timeout (in milliseconds) for archive status change updates. Set this to 0 to disable polling.
- `TIMEOUT_MULTIPLIER` (Optional, default value: 1.5) : Timeout multiplier. If the first archive status update polling fails, subsequent polling intervals will apply this multiplier
  successively. Set to a lower number to poll more often.

##### Archive Manager

- `ENABLE_ARCHIVE_MANAGER`: (Optional, default value: false) Enable Archive Manager. Only meaningful if `archiving` is not disabled

```json
"Archiving": {
    "enabled": true,
    "archiveAlways": false,
    "pollingInitialTimeout": 5000,
    "pollingTimeoutMultiplier": 1.5,
    "archiveManager": {
        "enabled": false
    }
},
```

#### Screen sharing configuration

- `ENABLE_SCREENSHARING`:(Optional, default value: false) Whether to enable screen sharing.
- `CHROME_EXTENSION_ID` :(Optional, LEGACY, default value: 'null'): The Chrome AddOn extension ID for screen sharing. Note: the Chrome extension is no longer required for screensharing.
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

The app lets the developer POST feedback data to an endpoint on your HTTP server:

`FEEDBACK_URL`: The URL to send a POST request with feedback data. Leave this as an empty string or
undefined to disable issue reporting.

`REPORT_ISSUE_LEVEL`: The audio and video scores in the feedback form are between 1 (awful) and 5 (excellent). When the feedback form is submitted, if an audio or video score is less than or equal to the report issue level, the app calls `OT.reportIssue()`. This reports an issue, which you can view in OpenTok Inspector. (For more information, see [Reporting an issue](https://tokbox.com/developer/guides/debugging/js/#report-issue) in the OpenTok developer Guides.) The default value is 3, set to 0 to disable issue reporting.

```json
"Feedback": {
    "url": "",
    "reportIssueLevel": 0
},
```

`HOTJAR_ID`: (Optional, default value: null) Unique site Id for the application. This helps hot jar tracking code to collect feedback data.

`HOTJAR_VERSION`: (Optional, default value: null) Version of the Tracking Code using with hjsv

`ENABLE_FEEDBACK`: (Optional, default value: false) Enables Feedback Form 

 ```json
 "Feedback": {
     "url": "",
     "reportIssueLevel": 0,
     "hotjarId": "",
     "hotjarVersion": "",
     "enableFeedback": false,
 },
 ```

 #### Pre-call test

 Set the the `TB_PRECALL_API_KEY` and `TB_PRECALL_API_SECRET` environment variables
 to the the OpenTok API key and secret to use for the test session used by
 the precall-test. Or set these in the config file:
  
  ```json
  "precallTest": {
      "apiKey": "46049502",
      "apiSecret": "0f4a63f629cec64ebdc5552974fe2566d2eb2835"
  },
  ```

  These are optional. If you do not set these, the pre-call test will use the same
  API key and secret that is used for the main OpenTok session used in the room.

  You can disable the pre-call test by setting the `ENABLE_PRECALL_TEST`
  environment variable to `false`. Or you can disable it using the config file:

   ```json
   "precallTest": {
       "enabled": false
   },
   ```

#### SIP connection

See the [Phone dial-out](#phone-dial-out) section.

#### Adobe Analytics

  The app lets the developer configure Adobe Analytics to track user information, the next env vars are needed:

* `ADOBE_TRACKING_URL` (Optional, default value: ''): URL to download the custom embed code.

* `ADOBE_TRACKING_PRIMARY_CATEGORY` (Optional, default value: ''): Value that will be included in Adobe Analytics
  object field: `digitalData.page.pageInfo.primaryCategory`.

* `ADOBE_TRACKING_SITE_IDENTIFIER` (Optional, default value: ''): Value that will be included in Adobe Analytics
  object field: `digitalData.page.pageInfo.siteIdentifier`.

* `ADOBE_TRACKING_FUNCTION_DEPT` (Optional, default value: ''): Value that will be included in Adobe Analytics
  object field: `digitalData.page.pageInfo.functionDept`.

### Additional configuration options

* `SHOW_TOS` (Optional, default value: false): Whether the app will display the terms of service
  dialog box and require the user to agree to the terms before joining a room.

* `MEETINGS_RATE_PER_MINUTE` (Optional, default value: -1): Determines the maximum amount of new meetings that
  can be created in a minute. Users will be allowed to join a meeting that already exists. Otherwise a message
  will appear telling them that the service is not available at the moment. If the value is set to any negative
  number, rate limiting will be turned off and all meetings will be allowed. If this value is set to 0, all new
  meetings will be rejected.

* `MIN_MEETING_NAME_LENGTH` (Optional, default value: 0): The minimum length of
  meeting names created. The default value, 0, indicates that there is no minimum
  length. (You can set this in the config file using the `minMeetingNameLength` setting.)

* `ALLOW_IFRAMING` (Optional, default value: 'never'): Controls the server-side restriction on
   allowing content to load inside an iframe. The allowed values are:

  - 'always': Allow iframing unconditionally (note that rtcApp.js should also be changed
     to reflect this, this option only changes what the server allows)

  - 'never': Set X-Frame-Options to 'DENY' (Deny loading content in any iframe)

  - 'sameorigin': Set X-Frame-Options to 'SAMEORIGIN' (Only allow iframe content to be loaded
    from pages in the same origin)

  We don't allow restricting iframe loading to specific URIs because it doesn't work on Chrome.

* `USE_GOOGLE_FONTS` (Optional, default value: true): Whether the client app will load
  the Open Sans font (the main font used in the user interface) from the Google font library
  (fonts.googleapis.com) or not.

* `JQUERY_URL` (Optional, default value: 'https://ajax.googleapis.com/ajax/libs/jquery/'):
  Route of the CDN that will be used to load JQuery scripts.

* `USE_GOOGLE_FONTS` (Optional, default value: true): Whether the client app will load
   the Open Sans font (the main font used in the user interface) from the Google font library
   (fonts.googleapis.com) or not.

* `MEDIA_MODE` (Optional, default value: 'routed'): Whether the OpenTok sessions should be `relayed` or `routed`.

* `ENABLE_MUTE_ALL` (Optional, default value: true): Whether to show the Mute All
 control in the top menu of the room. (You can set this in the config file
 using the `enableMuteAll` setting.)

* `ENABLE_STOP_RECEIVING_VIDEO` (Optional, default value: true): Whether to show
 the Stop Receiving Video control in the top menu of the room. (You can set this
 in the config file using the `enableStopReceivingVideo` setting.)
 
* `MAX_USERS_PER_ROOM` (Optional, default value: 0): The maximum number of users
  allowed in a room at the same time. Set this to 0, the default, to allow
  any number of users. (You can set this in the config file using
  the `maxUsersPerRoom` setting.)

* `ENABLE_ROOM_LOCKING` (Optional, default value: true). Wheter or not to show the Lock Meeting icon to users in the options menu. This setting allows users to avoid new participants to join a locked meeting.

## Customizing the UI

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

We recommend that you run the application as a non-root user. However, if you are running the application as the `root` user, you will additionally need to tell `bower` to allow root user to install dependencies, else bower will refuse to work:

```
$ bower install --allow-root
```

### Health status check

There is a health status check endpoint at /server/health. You can load this URL to check whether
the app is able to connect to all required external services. On success, this health check
endpoint sends a response with the HTTP status code set to 200 and the JSON like the following:

```json
{
  "name": "opentok-rtc",
  "version": "4.1.1",
  "gitHash": "312903cd043d5267bc11639718c47a9b313c1663",
  "opentok": true,
  "googleAuth": true,
  "status": "pass"
}
```

The JSON includes the following properties:

- `name` -- `"ot-embed"`

- `version` -- The version number deployed (from package.json)

- `git_hash` -- The git commit deployed

- `opentok` -- Whether the OpenTok API check passed. The app uses the OpenTok Node.js SDK,
  which connects to the OpenTok API server to create OpenTok sessions.

- `googleAuth` -- Whether the Google Authentication check passed. This check is only run if the app
  uses Google Authentication for making outbound SIP calls. (See [Google Authentication for
  Phone dial-out](#google-authentication-for-phone-dial-out).)

- `status` -- "pass" (if all checks pass) or "fail" (if any check fails)

On failure, the health status check endpoint returns a response with
the HTTP status code set 400 and JSON like the following:

```json
{
  "name": "opentok-rtc",
  "version": "4.1.1",
  "git_hash": "312903cd043d5267bc11639718c47a9b313c1663",
  "opentok": true,
  "error": "Error description",
  "status": "fail"
}
```

Note that upon failure, the `status` property is set to `"fail"` and the `error` property
is set to an error message. Also, the property for the failing test, such
will be set to `false`. If a test fails, the health check will not run subsequent tests.

## Development and Contributing

Interested in contributing? We :heart: pull requests! See the
[Contribution](CONTRIBUTING.md) guidelines.

## Getting Help

We love to hear from you so if you have questions, comments or find a bug in the project, let us know! You can either:

- Open an issue on this repository
- See <https://support.tokbox.com/> for support options
- Tweet at us! We're [@VonageDev](https://twitter.com/VonageDev) on Twitter
- Or [join the Vonage Developer Community Slack](https://developer.nexmo.com/community/slack)

## Further Reading

- Check out the Developer Documentation at <https://tokbox.com/developer/>
