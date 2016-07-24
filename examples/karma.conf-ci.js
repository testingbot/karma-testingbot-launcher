module.exports = function (config) {
  var customLaunchers = {
    'TB_Chrome': {
      base: 'TestingBot',
      platform: 'VISTA',
      browserName: 'chrome',
      customData: {
        awesome: true
      }
    },
    'TB_Firefox': {
      base: 'TestingBot',
      platform: 'VISTA',
      browserName: 'firefox'
    },
    'TB_IE': {
      base: 'TestingBot',
      platform: 'VISTA',
      browserName: 'internet explorer'
    }
  }

  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'src/*.js',
      'test/*.js'
    ],
    reporters: ['progress', 'testingbot'],
    port: 4040,
    colors: true,
    logLevel: config.LOG_DEBUG,
    testingbot: {
      testName: 'Karma and TestingBot demo',
      recordScreenshots: false,
      connectOptions: {
        verbose: true,
        'se-port': 4445,
        logfile: 'testingbot_tunnel.log'
      },
      public: 'public'
    },
    // Increase timeout in case connection in CI is slow
    captureTimeout: 120000,
    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),
    singleRun: true
  })
}
