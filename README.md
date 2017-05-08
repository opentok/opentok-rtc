![logo](./tokbox-logo.png)

# TokBox Reference Apps: conferencing
This is a TokBox reference application illustrating the use case: conferencing.

## Installation

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
You will need your OpenTok API Key and Secret. These can be obtained from the [developer dashboard](https://tokbox.com/account/#/)
Substitute your key and secret into the snippet below and execute.

```
redis-cli set tb_api_key yourkeyhere
redis-cli set tb_api_secret yoursecrethere
npm install
bower install
grunt
```


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

Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free. To easily deploy this repository to Heroku, sign up for a Heroku account and click this
button:

<a href="https://heroku.com/deploy?template=https://github.com/opentok/OpenTokRTC-V2" target="__blank">
  <img src="https://www.herokucdn.com/deploy/button.png" alt="Deploy">
</a>

Heroku will prompt you to add your OpenTok API key and OpenTok API secret, which you can
obtain at the [TokBox Dashboard](https://dashboard.tokbox.com/keys).

You can also install this repository on your own server (see the previous sections).

If you prefer to deploy to Heroku manually, follow the procedure described next. The configuration
differs slightly from the one required to run the application as standalone. It requires having
some redis service as an addon. Currently it detects and supports the following redis services:

 - Heroku-redis: https://devcenter.heroku.com/articles/heroku-redis
 - Redis-to-go: https://elements.heroku.com/addons/redistogo

#### Requirements:
You have to own a validated Heroku account (with the ability to use free addons).

#### Installation:

You have to set the following environment variables on your heroku instance:
 - TB_API_KEY: Your Opentok api key.
 - TB_API_SECRET: Your Opentok api secret.

Execute:
```
heroku create
heroku config:set TB_API_KEY='yourkey' TB_API_SECRET='yoursecret'
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
