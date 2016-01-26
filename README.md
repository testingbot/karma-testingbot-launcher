# karma-testingbot-launcher

> Run your tests on [TestingBot](https://testingbot.com/)' browser cloud!


## Installation

Install `karma-testingbot-launcher` as a `devDependency` in your package.json:

```bash
npm install karma-testingbot-launcher --save-dev
```

## Usage

This launcher is used to run your tests across many browsers and platforms on TestingBot. You can run the same tests on different browser versions and mobile browsers.

### Adding karma-testingbot-launcher to an existing Karma config

To use and configure this launcher, you will need to add two properties to your top-level Karma config, `testingbot` and `customLaunchers`, set the `browsers` array to use TestingBot browsers, and add the `testingbot` reporter.

The `testingbot` object defines global properties for each browser/platform while the `customLaunchers` object configures individual browsers. The `testingbot` reporter will send back the test success state to https://testingbot.com. Here is a sample Karma config to get the launcher running:

```js
module.exports = function(config) {
  // Check out https://testingbot.com/support/getting-started/browsers.html for all browser possibilities
  var customLaunchers = {
    TB_chrome: {
      base: 'TestingBot',
      browserName: 'chrome',
      platform: 'Windows 7',
      version: '35'
    },
    TB_firefox: {
      base: 'TestingBot',
      browserName: 'firefox',
      version: '30'
    }
  }

  config.set({

    // The rest of your karma config is here
    // ...
    testingbot: {
        testName: 'Web App Unit Tests'
    },
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    reporters: ['dots', 'testingbot'],
    singleRun: true
  })
}
```

**Note: this config assumes that `process.env.TB_KEY` and `process.env.TB_SECRET` are set.**

## `testingbot` config properties shared across all browsers

### apiKey
Type: `String`
Default: `process.env.TB_KEY`

Your TestingBot api key, you can sign up [here](https://testingbot.com/users/sign_up).

### apiSecret
Type: `String`
Default: `process.env.TB_SECRET`

Your TestingBot api secret which you will see on your [account page](https://testingbot.com/members).

### connectOptions
Type: `Object`
Default:
```js
{
  apiKey: 'apiKey',
  apiSecret: 'apiSecret'
}
```

Options to send to TestingBot. Check [here](https://testingbot.com/support/other/test-options) for all available options.

### build
Type: `String`
Default: *One of the following environment variables*:
`process.env.BUILD_NUMBER`
`process.env.BUILD_TAG`
`process.env.CI_BUILD_NUMBER`
`process.env.CI_BUILD_TAG`
`process.env.TRAVIS_BUILD_NUMBER`
`process.env.CIRCLE_BUILD_NUM`
`process.env.DRONE_BUILD_NUMBER`

ID of the build currently running. This should be set by your CI.

### name
Type: `String`
Default: `'Karma test'`

Name of the unit test group you are running.

### tags
Type: `Array of Strings`

Tags to use for filtering jobs in your TestingBot account.

### screenrecorder
Type: `Boolean`
Default: `false`

Set to `true` if you want to record a video of your Karma session.

### screenshots
Type: `Boolean`
Default: `true`

Set to `false` if you don't want to record screenshots.

### public
Type: `String`
Default: `null`

Control who can view job details.

## `customLaunchers` config properties

The `customLaunchers` object has browser names as keys and configs as values. Documented below are the different properties which you can configure for each browser/platform combo.

*Note: You can learn about the available browser/platform combos on the [TestingBot browsers page](https://testingbot.com/support/getting-started/browsers.html).*

### base
Type: `String`
Required: `true`

This defines the base configuration for the launcher. In this case it should always be `TestingBot` so that browsers can use the base TestingBot config defined at the root `testingbot` property.

### browserName
Type: `String`
Required: `true`

Name of the browser.

### version
Type: `String`
Default: Latest browser version for all browsers

Version of the browser to use.

### platform
Type: `String`
Default: `'Linux'` for Firefox/Chrome, `'Windows 7'` for IE/Safari

Name of platform to run browser on.

### deviceOrientation
Type: `String`
Default: `'portrait'`

Accepted values: `'portrait' || 'landscape'`

Set this string if your unit tests need to run on a particular mobile device orientation for Android Browser or iOS Safari.
