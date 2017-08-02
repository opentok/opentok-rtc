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

## Config settings for overriding the default user interface

You can set properties in the config/config.json file to override some default
user interface elements. Or you can set environment variables to set overrides.

| config property <br> (JSONPath) | Environment variable | Description |
| ------------- | ------------- | -- |
| `ui.index.mainTitle`  | `INDEX_MAIN_TITLE` | Content to add to the top of the index page. See the views/index.ejs file to see the default content. |
| `ui.index.confirmationDbText`  | `INDEX_CONFIRMATION_DB_TEXT`   | Text to display in a confirmation dialog in the index page. If this is set, a confirmation dialog box is displayed before the user enters the chat room. If it is not set, no confirmation dialog box is displayed. |
| `ui.room.css`  | `ROOM_CSS`  | A path to the CSS file to use for the room page. If this is not set, the page uses the css/room.opentok.css file. |
| `ui.room.customMenuItems`  | `ROOM_CUSTOM_MENU_ITEMS`  | Custom menu items to add to the left-hand menu of the room page. |
| `ui.endCall.headerText`  | `END_CALL_HEADER_TEXT`  | Content to add to the top of the end call page. See the templates/endMeeting.ejs file to see the default content. |
| `ui.endCall.showTbLinks`  | `END_CALL_SHOW_TB_LINKS`  | Whether to simply display links to TokBox info ("Build a WebRTC app and "Learn about TokBox") in the end call page. The default is `false`, and the end call page displays other info, including a list of archives (if there are any) for the call. |

The following is an example of a config/config.json file that sets each of these user interface options:

```json
{
    "OpenTok": {
        "apiKey": "12345",
        "apiSecret": "58ade1b63e6a883bf"
    },
    "ui": {
      "index": {
        "mainTitle": "<h1>The OpenTok Platform Demo</h1>",
        "confirmationDbText": "By accepting our terms of use you acknowledge that you have read the <a target=\"_blank\" href=\"https://tokbox.com/support/tos\">user agreement</a>, and <a target=\"_blank\" href=\"https://tokbox.com/support/privacy-policy\">privacy policy</a>, and you are at least 18 years of age.</p>"
      },
      "room": {
        "css": "/css/webrtc.opentok.css",
        "customMenuItems": "<li class=\"tooltip\" tooltip=\"Stop receiving video\">\n  <a id=\"videoSwitch\"><i data-icon=\"videoSwitch\"></i><span>Stop receiving video</span></a>\n</li>\n<li class=\"tooltip\" tooltip=\"Mute all participants\">\n  <a id=\"audioSwitch\"><i data-icon=\"audioSwitch\"></i><span>Mute all participants</span></a>\n</li>\n<li>\n  <a id=\"endCall\" class=\"danger\"><i data-icon=\"end\"></i><span>End meeting</span></a>\n</li>\n<li class=\"bottom tooltip\" tooltip=\"See Documentation\">\n  <a href=\"https://tokbox.com/developer/\" target=\"_blank\" class=\"button see-documentation\"><span>See Documentation</span></a>\n</li>\n<li class=\"tooltip\" tooltip=\"Talk to Sales\">\n  <a href=\"https://tokbox.com/contact/sales\" target=\"_blank\" class=\"button talk-to-sales\"><span>Talk to Sales</span></a>\n</li>"
      },
      "endCall": {
        "headerText": "Thank you for trying the TokBox WebRTC Demo.",
        "showTbLinks": true
      }
    }
}
```

## Changing landing page HTML

Edit the view file [`views/index.ejs`](views/index.ejs) and change the images and text in the `<body>` section. You can also change the text in the `<title>` tag.
