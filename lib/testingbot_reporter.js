var TestingBotApi = require('testingbot-api')

var TBReporter = function (logger, /* testingbot:jobMapping */ jobMapping) {
  var log = logger.create('reporter.testingbot')

  var pendingUpdates = 0
  var updatesFinished = function () {}

  this.adapters = []

  // We're only interested in the final results per browser
  this.onBrowserComplete = function (browser) {
    var result = browser.lastResult

    // browser.launchId was used until v0.10.2, but changed to just browser.id in v0.11.0
    var browserId = browser.launchId || browser.id

    if (result.disconnected) {
      log.error('✖ Test Disconnected')
    }

    if (result.error) {
      log.error('✖ Test Errored')
    }

    if (browserId in jobMapping) {
      var jobDetails = jobMapping[browserId]
      var tbApi = new TestingBotApi(jobDetails.credentials)

      // We record pass/fail status
      var payload = {
        "test[success]": !(result.failed || result.error || result.disconnected) ? "1" : "0"
      }

      if (result.error) {
        payload['test[status_message]'] = result.error.toString();
      }

      pendingUpdates++

      tbApi.updateTest(payload, jobDetails.jobId, function (err) {
        pendingUpdates--
        if (err) {
          log.error('Failed record pass/fail status: %s', err.error)
        }

        if (pendingUpdates === 0) {
          updatesFinished()
        }
      })
    }
  }

  // Wait until all updates have been pushed
  this.onExit = function (done) {
    if (pendingUpdates) {
      updatesFinished = done
    } else {
      done()
    }
  }
}

module.exports = TBReporter
