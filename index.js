var TBTunnel = require('./lib/testingbot_tunnel')
var TBLauncher = require('./lib/testingbot_launcher')
var TBReporter = require('./lib/testingbot_reporter')

// PUBLISH DI MODULE
module.exports = {
  'testingbotTunnel': ['type', TBTunnel],
  'launcher:TestingBot': ['type', TBLauncher],
  'reporter:testingbot': ['type', TBReporter],

  'testingbot:jobMapping': ['value', {}]
}
