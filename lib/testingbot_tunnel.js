var q = require('q')
var launchTestingBotTunnel = require('testingbot-tunnel-launcher')

var TBTunnel = function (emitter, logger) {
  var log = logger.create('launcher.testingbot')
  var alreadyRunningDefered
  var alreadyRunningProces

  this.start = function (connectOptions, done) {
    connectOptions.logger = log.debug.bind(log)

    if (alreadyRunningDefered) {
      log.debug('TestingBot Tunnel is already running or starting')
      return alreadyRunningDefered.promise
    }

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
      alreadyRunningProces.close(done)
      alreadyRunningProces = null
    } else {
      done()
    }
  })
}

module.exports = TBTunnel