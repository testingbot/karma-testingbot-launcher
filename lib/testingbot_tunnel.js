var q = require('q')
var launchTestingBotTunnel = require('testingbot-tunnel-launcher')

var testingbotTunnel = function (emitter, logger) {
  var log = logger.create('launcher.testingbot')
  var alreadyRunningDefered
  var alreadyRunningProces

  this.start = function (connectOptions, done) {
    if (alreadyRunningDefered) {
      log.debug('TestingBot Tunnel is already running or starting')
      return alreadyRunningDefered.promise
    }

    process.on('SIGINT', function () {
      if (alreadyRunningProces) {
        alreadyRunningProces.close()
      }
    })

    alreadyRunningDefered = q.defer()
    launchTestingBotTunnel(connectOptions, function (err, p) {
      if (err) {
        return alreadyRunningDefered.reject(err)
      }
      alreadyRunningProces = p
      alreadyRunningDefered.resolve()
    })

    return alreadyRunningDefered.promise
  }

  emitter.on('exit', function (done) {
    if (alreadyRunningProces) {
      log.info('Shutting down TestingBot Tunnel')
      setTimeout(function () {
        // wait a couple of seconds to make sure all http requests are processed
        alreadyRunningProces.close(done)
        alreadyRunningProces = null
      }, 2000)
    } else {
      done()
    }
  })
}

module.exports = testingbotTunnel
