# OpenTokRTC

<img src="https://assets.tokbox.com/img/vonage/Vonage_VideoAPI_black.svg" height="48px" alt="Tokbox is now known as Vonage" />

[![Build Status](https://travis-ci.com/opentok/opentok-rtc.svg?token=qPpN1jG8Wftsn1cafKif&branch=master)](https://travis-ci.com/opentok/opentok-rtc)
[![codecov](https://codecov.io/gh/opentok/opentok-rtc/branch/master/graph/badge.svg)](https://codecov.io/gh/opentok/opentok-rtc/branch/master)

**Important:** This code should not be merged into the main branch.

This version of the app loads a page that redirects all pages Vonage Free Conferencing
(https://www.vonage.com/communications-apis/video/vonage-free-conferencing/).


## Installation

If you want to install OpenTokRTC on your own server, read on. If you want to deploy OpenTokRTC to Heroku, see [`INSTALL-heroku.md`](INSTALL-heroku.md).

### Requirements

You will need these dependencies installed on your machine:

- [NodeJS v8+](https://nodejs.org): This version of OpenTokRTC is tested with NodeJS v8 LTS.
- [Redis](https://redis.io): A `redis` server running on `localhost`.
- [Grunt](http://gruntjs.com): Used for bundling assets and running tests. You can install the Grunt CLI globally by running: `# npm i -g grunt-cli`.

## Running

Start the application in foreground by running:

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

## Further Reading

- Check out the Developer Documentation at <https://tokbox.com/developer/>
