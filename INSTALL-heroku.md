# Installing OpenTokRTC on Heroku

Heroku is a PaaS (Platform as a Service) that can be used to deploy simple and small applications
for free.

## Requirements

You will need a validated Heroku account (with the ability to use free add-ons). You can read about account verification in [this Heroku Article](https://devcenter.heroku.com/articles/account-verification). Verification is needed as the application uses the [heroku-redis](https://devcenter.heroku.com/articles/heroku-redis) service.

## Easy install

To easily deploy this repository to Heroku, sign up for a Heroku account and click this
button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/opentok/opentok-rtc)

If you prefer to deploy to Heroku manually instead, follow the procedure described next.

Heroku will prompt you to add your Vonage application ID and private key, which you can obtain at the [Vonage dashboard](https://dashboard.nexmo.com/).

You have to set the following environment variables on your Heroku instance:

- `VONAGE_APPLICATION_PATH_`: Your Vonage application's private key path.

## Manual Installation using Heroku CLI

You will need to install Heroku CLI tool. For information on downloading and using the heroku CLI, see their official documentation: https://devcenter.heroku.com/articles/heroku-cli.

First, create the app:

```sh
$ heroku create
```

Now you will have to set the following environment variables on your heroku instance. Replace `<applicationId>` and `<key>` with your Vonage application ID and the corresponding private key:

```sh
$ heroku config:set VONAGE_APPLICATION_ID=<applicationId> VONAGE_PRIVATE_KEY=<key>
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
- `allow_iframing` => ALLOW_IFRAMING
- `valid_refrers` => VALID_REFERERS
- `chrome_extension_id` => CHROME_EXTENSION_ID
