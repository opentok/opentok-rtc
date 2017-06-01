# Installing OpenTokRTC on Heroku
Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free.

#### Requirements:
You will need a validated Heroku account (with the ability to use free add-ons). You can read about account verification in [this Heroku Article](https://devcenter.heroku.com/articles/account-verification). (Verification is needed as the application uses the [Heroku-redis service](https://devcenter.heroku.com/articles/heroku-redis)).

#### Quick Installation
Once you have verified your account, just click this button

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/opentok/OpenTokRTC-V2)

Heroku will prompt you to add your OpenTok API key and OpenTok API secret, which you can
obtain at the [TokBox Dashboard](https://tokbox.com/account).


If you prefer to deploy to Heroku manually, see the following section.

#### Manual Installation using Heroku CLI:
For information on downloading and using the heroku CLI, see their official documentation: https://devcenter.heroku.com/articles/heroku-cli

#### Installation:
First, create the app:

```sh
$ heroku create
```

Now you will have to set the following environment variables on your heroku instance. Replace `<key>` and `<secret>` with your OpenTok API key and the corresponding API secret:

```sh
$ heroku config:set TB_API_KEY=<key> TB_API_SECRET=<secret>
```

If you want to use Archive Management (In app playback and download of recordings), set up Firebase configuration. Replace `<appurl>` with your Firebase application URL and `<appsecret>` with the secret for that Firebase app in this command:

```sh
$ heroku config:set FB_DATA_URL=<appurl> FB_AUTH_SECRET=<appsecret> ENABLE_ARCHIVE_MANAGER=true
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
README.md file, using environment variables:

- `tb_archive_polling_initial_timeout` => ARCHIVE_TIMEOUT
- `tb_archive_polling_multiplier` => TIMEOUT_MULTIPLIER
- `tb_max_session_age` => TB_MAX_SESSION_AGE
- `tb_max_history_lifetime` => EMPTY_ROOM_LIFETIME
- `allow_iframing` => ALLOW_IFRAMING
- `valid_refrers` => VALID_REFERERS
- `chrome_extension_id` => CHROME_EXTENSION_ID
