# opentokRTCV2: Showcase application for the OpenTok API.
## Introduction

This repository holds a complete demo application for the OpenTok API. 

(TO-DO TO-DO: Add OpenTok reference URLS)

The repository includes a complete client application, and the server
needed to access the OpenTok functionality. You can access a demo
installation at https://opentokrtc.com (TO-DO TO-DO: Fix this!)

## Installation

#### Prerequisites:
You'll need:

- NodeJS: https://nodejs.org/en/. You can install it with nvm. You'll
  need version 4.0.0 or newer of Node.
  https://github.com/creationix/nvm/.
- Redis: http://redis.io.
- An active OpenTok account on https://tokbox.com/developer/. You'll
  need the API Key and secret, which you can get from
  https://dashboard.tokbox.com/ once you've created the account.

#### Installation:
Execute

```
redis-cli set tb_api_key yourkeyhere
redis-cli set tb_api_secret yoursecrethere
npm install
```

(replace yourkeyhere and yoursecret here with the API key and API
secret).

## Running

```
node server [[listening port] [static files directory]]
```

where:

- listening port: Is the port where the server will listen. By default
  it listens on the port 8123.
- static files directory: Filw where the web files reside. By default
  it's ./web.

