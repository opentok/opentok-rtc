# Contributing to OpenTokRTC

## Issues

If you are filing a bug, please specify the following:

- Version of NodeJS: `$ node --version`
- Version of npm: `$ npm --version`
- Version of Redis server
- Copy of error message, if any
- Screenshot of perceived bug, if any.

## Contributing code

If you are contributing code to OpenTokRTC, please ensure the following:

- Add test for any feature that you add or change. Tests go in the `./test` directory.
- Run test locally and ensure they pass, so that you do not break any build. Run tests using: `$ grunt precommit`.
- Use the AirBnB JavaScript style guide.

## Running appliction in development mode:

In a development environment, you can start the application by running:

```
$ npm run dev
```

This will start the node server on port 8123 and start watching .less files for changes.
