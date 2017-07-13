# Customizing OpenTokRTC UI

You can customize UI colors and logos of OpenTokRTC. Follow this guide to know where to edit them.

## Changing theme colors

OpenTokRTC uses the LESS CSS pre-processor for its CSS. Values for theme colors are in the file [`web/less/variables.less`](web/less/variables.less). Edit this values in this file to suit your needs.

Once you have edited this file, you will need to build new UI assets. Run:

```
$ grunt clientBuild
```

## Adding static assets

The `web/` directory in the project root is mounted as a static path in the application root. Any files or directories in this directory will be accessible in the browser relative to the application root (`/`).

You can put your images in the `web/images` directory. They can be accessed in the application as `/images/`. For example, the file `web/images/opentok-logo.png` can be accessed in the browser as `/images/opentok-logo.png`.

## Changing landing page HTML

Edit the view file [`views/index.ejs`](views/index.ejs) and change the images and text in the `<body>` section. You can also change the text in the `<title>` tag.
