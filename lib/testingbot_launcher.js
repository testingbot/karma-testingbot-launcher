var wd = require('wd')

function formatError (err) {
  return err.message + '\n' + (err.data ? '  ' + err.data : '')
}

function processConfig (helper, config, args) {
  config = config || {}
  args = args || {}

  var apiKey = args.apiKey || config.apiKey || process.env.TB_KEY || process.env.TESTINGBOT_KEY
  var apiSecret = args.apiSecret || config.apiSecret || process.env.TB_SECRET || process.env.TESTINGBOT_SECRET
  var startConnect = config.startConnect !== false
  var tunnelIdentifier = args.tunnelIdentifier || config.tunnelIdentifier

  if (startConnect && !tunnelIdentifier) {
    tunnelIdentifier = 'karma' + Math.round(new Date().getTime() / 1000)
  }

  var browserName = args.browserName +
        (args.version ? ' ' + args.version : '') +
        (args.platform ? ' (' + args.platform + ')' : '')

  var connectOptions = helper.merge(config.connectOptions, {
    apiKey: apiKey,
    apiSecret: apiSecret,
    'se-port': 4445,
    'tunnel-identifier': tunnelIdentifier
  })

  var seleniumHost = config.seleniumHost || 'hub.testingbot.com'
  var seleniumPort = config.seleniumPort || 80

  var build = process.env.BUILD_NUMBER ||
        process.env.BUILD_TAG ||
        process.env.CI_BUILD_NUMBER ||
        process.env.CI_BUILD_TAG ||
        process.env.TRAVIS_BUILD_NUMBER ||
        process.env.CIRCLE_BUILD_NUM ||
        process.env.DRONE_BUILD_NUMBER

  var defaults = {
    version: '',
    platform: 'ANY',
    tags: [],
    name: 'Karma Test',
    'tunnel-identifier': tunnelIdentifier,
    'screenrecorder': false,
    'screenshots': false,
    'device-orientation': null,
    'disable-popup-handler': true,
    build: build || null,
    public: null,
    customData: {}
  }

  var options = helper.merge(
    // Legacy
    config.options,
    defaults, {
      // Pull out all the properties from the config that
      // we are interested in
      name: config.testName,
      build: config.build,
      'screenrecorder': config.recordVideo,
      'screenshots': config.recordScreenshots,
      public: config.public,
      customData: config.customData
    }, {
      // Need to rename some properties from args
      name: args.testName,
      'screenrecorder': args.recordVideo,
      'screenshots': args.recordScreenshots
    }, args
  )

  return {
    options: options,
    connectOptions: connectOptions,
    browserName: browserName,
    apiKey: apiKey,
    apiSecret: apiSecret,
    startConnect: startConnect,
    seleniumHost: seleniumHost,
    seleniumPort: seleniumPort
  }
}

var TBLauncher = function (
  args, testingbotTunnel,
  /* config.testingbot */ config,
  logger, helper,
  baseLauncherDecorator, captureTimeoutLauncherDecorator, retryLauncherDecorator,
  /* testingbot:jobMapping */ jobMapping
) {
  var self = this

  baseLauncherDecorator(self)
  captureTimeoutLauncherDecorator(self)
  retryLauncherDecorator(self)

  var pConfig = processConfig(helper, config, args)
  var options = pConfig.options
  var connectOptions = pConfig.connectOptions
  var browserName = pConfig.browserName
  var apiKey = pConfig.apiKey
  var apiSecret = pConfig.apiSecret
  var startConnect = pConfig.startConnect
  var seleniumHost = pConfig.seleniumHost
  var seleniumPort = pConfig.seleniumPort

  var pendingCancellations = 0
  var sessionIsReady = false

  self.name = browserName + ' on TestingBot'

  var pendingHeartBeat

  var log = logger.create('launcher.testingbot')
  var driverLog = logger.create('wd')

  var driver = wd.promiseChainRemote(seleniumHost, seleniumPort, apiKey, apiSecret)

  driver.on('status', function (info) {
    driverLog.debug(info.cyan)
  })

  driver.on('command', function (eventType, command, response) {
    driverLog.debug(' > ' + eventType.cyan, command, (response || '').grey)
  })

  driver.on('http', function (meth, path, data) {
    driverLog.debug(' > ' + meth.magenta, path, (data || '').grey)
  })

  var heartbeat = function () {
    pendingHeartBeat = setTimeout(function () {
      log.debug('Heartbeat to TestingBot (%s) - fetching title', browserName)

      driver.title()
        .then(null, function (err) {
          log.error('Heartbeat to %s failed\n  %s', browserName, formatError(err))

          clearTimeout(pendingHeartBeat)
          return self._done('failure')
        })

      heartbeat()
    }, 60000)
  }

  var start = function (url) {
    driver
      .init(options)
      .then(function () {
        if (pendingCancellations > 0) {
          pendingCancellations--
          return
        }
        // Record the job details, so we can access it later with the reporter
        jobMapping[self.id] = {
          jobId: driver.sessionID,
          credentials: {
            api_key: apiKey,
            api_secret: apiSecret
          }
        }

        sessionIsReady = true

        log.info('%s session at https://testingbot.com/tests/%s', browserName, driver.sessionID)
        log.debug('WebDriver channel for %s instantiated, opening %s', browserName, url)

        return driver.get(url)
          .then(heartbeat, function (err) {
            log.error('Can not start %s\n  %s', browserName, formatError(err))
            return self._done('failure')
          })
      }, function (err) {
        if (pendingCancellations > 0) {
          pendingCancellations--
          return
        }

        log.error('Can not start %s\n  %s', browserName, formatError(err))
        return self._done('failure')
      })
      .done()
  }

  self.on('start', function (url) {
    if (pendingCancellations > 0) {
      pendingCancellations--
      return
    }

    if (startConnect) {
      testingbotTunnel.start(connectOptions)
        .then(function () {
          if (pendingCancellations > 0) {
            pendingCancellations--
            return
          }

          start(url)
        }, function (err) {
          pendingCancellations--
          log.error('Can not start %s\n  Failed to start TestingBot Tunnel:\n  %s', browserName, err.message)

          self._retryLimit = -1 // don't retry
          self._done('failure')
        })
    } else {
      start(url)
    }
  })

  self.on('kill', function (done) {
    var allDone = function () {
      self._done()
      done()
    }

    if (sessionIsReady) {
      if (pendingHeartBeat) {
        clearTimeout(pendingHeartBeat)
      }

      log.debug('Shutting down the %s driver', browserName)
      driver.quit().nodeify(allDone)
      sessionIsReady = false
    } else {
      pendingCancellations++
      process.nextTick(allDone)
    }
  })
}

module.exports = TBLauncher
