# Chessslang Localization

### Extracting messages from code

As our source code is written in TypeScript, firstly we need to transpile our TypeScript code to JavaScript code.

To do this we can run following npm script

`npm run compile-js`

After this script execution is finished we have JavaScript code in a folder called `js-src`

Then we can run `npm run extract-messages`. Which will extract all the messages from our `js-src` folder

### Messages auto add/update

Whenever we are running the app in dev mode and we add/update a formatted message It will automatically sent to locize and the message will be added/updated.

To enable this feature we’ve wrappers components for `FormattedMessage` and `FormattedHTMLMessage` which are imported from `svc-ui/locize/index` instead of importing the native `FormattedMessage` and `FormattedHTMLMessage` from `react-intl`.

This feature only works when the app is in dev mode.
