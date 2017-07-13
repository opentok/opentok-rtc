# Installing OpenTokRTC on Heroku

Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free.

## Requirements

You will need a validated Heroku account (with the ability to use free add-ons). You can read about account verification in [this Heroku Article](https://devcenter.heroku.com/articles/account-verification). Verification is needed as the application uses the [heroku-redis](https://devcenter.heroku.com/articles/heroku-redis) service.

## Easy install

To easily deploy this repository to Heroku, sign up for a Heroku account and click this
button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/opentok/OpenTokRTC-V2)

If you prefer to deploy to Heroku manually instead, follow the procedure described next.

Heroku will prompt you to add your OpenTok API key and OpenTok API secret, which you can obtain at the [TokBox Dashboard](https://tokbox.com/account).

You have to set the following environment variables on your Heroku instance:

- `TB_API_KEY`: Your Opentok api key.
- `TB_API_SECRET`: Your Opentok api secret.

The following environment variables are optional and required only if you enable Archive Manager.

- `ENABLE_ARCHIVING`: (Optional) Whether to enable or disable archiving. Set to `false` to disable. Default: `true`
- `ENABLE_ARCHIVE_MANAGER`: (Optional) Whether to enable or disable archiving manager to store and retrieve archive information. Set to `true` to enable. Default: `false`. If enabled, needs following Firebase configuration.
- `FB_API_KEY`: (Optional) Firebase web API key.
- `FB_DATA_URL`: (Optional) A Firebase database URL to store the archive list for each room.
- `FB_CREDENTIAL`: (Optional) Content of Firebase service account private key.
- `FB_IOS_APP_ID`: (Optional) Firebase iOS app ID. This is the value of `GOOGLE_APP_ID` key in Firebase's iOS configuration (`.plist`) file.
- `FB_IOS_SENDER_ID`: (Optional) Firebase iOS sender ID. This is the value of `GCM_SENDER_ID` key in Firebase's iOS configuration (`.plist`) file.

## Manual Installation using Heroku CLI

You will need to install Heroku CLI tool. For information on downloading and using the heroku CLI, see their official documentation: https://devcenter.heroku.com/articles/heroku-cli.

First, create the app:

```sh
$ heroku create
```

Now you will have to set the following environment variables on your heroku instance. Replace `<key>` and `<secret>` with your OpenTok API key and the corresponding API secret:

```sh
$ heroku config:set TB_API_KEY=<key> TB_API_SECRET=<secret>
```

If you want to use Archive Management (In app playback and download of recordings), set up Firebase configuration. Replace the following in the commands that follow:
- `<fb-apikey>` with your Firebase application's web API key
- `<fburl>` with your Firebase application's database URL
- `<credential-file>` with the path to the private key for your Firebase application's service account

```sh
$ CREDENTIAL=$(cat <credential-file>)
$ heroku config:set FB_API_KEY="<fb-apikey>" FB_DATA_URL="<fburl>" FB_CREDENTIAL="$CREDENTIAL" ENABLE_ARCHIVE=true ENABLE_ARCHIVE_MANAGER=true
```

You will need to choose a redis addon. These two are currently supported,
 - Heroku-redis: https://devcenter.heroku.com/articles/heroku-redis
 - Redis-to-go: https://elements.heroku.com/addons/redistogo

The app uses heroku-redis, which you can set up like this:

```sh
heroku plugins:install heroku-redis
heroku addons:create heroku-redis:hobby-dev
```

You can deploy your code using git: https://devcenter.heroku.com/articles/git#deploying-code.

Additionally you can also modify all the other configuration options described in the main
[README.md](README.md) file, using environment variables:

- `tb_archive_polling_initial_timeout` => ARCHIVE_TIMEOUT
- `tb_archive_polling_multiplier` => TIMEOUT_MULTIPLIER
- `tb_max_session_age` => TB_MAX_SESSION_AGE
- `tb_max_history_lifetime` => EMPTY_ROOM_LIFETIME
- `allow_iframing` => ALLOW_IFRAMING
- `valid_refrers` => VALID_REFERERS
- `chrome_extension_id` => CHROME_EXTENSION_ID
