goog.module('os.net.BaseServerModifier');

const Settings = goog.require('os.config.Settings');
const URLModifier = goog.require('os.net.URLModifier');


/**
 * @param {string} server
 */
const configure = function(server) {
  if (server) {
    var config = {};
    config[Settings.getInstance().get('baseServerRegex', '^\\/([^\\/].*)$')] = server.replace(/\/$/, '') + '/$1';
    URLModifier.configure(config);
  }
};

exports = {
  configure
};
