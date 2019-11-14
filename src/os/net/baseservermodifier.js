goog.provide('os.net.BaseServerModifier');
goog.require('goog.Uri');
goog.require('os.net.URLModifier');


/**
 * @param {string} server
 */
os.net.BaseServerModifier.configure = function(server) {
  if (server) {
    var config = {};
    config[os.settings.get('baseServerRegex', '^\\/([^\\/].*)$')] = server.replace(/\/$/, '') + '/$1';
    os.net.URLModifier.configure(config);
  }
};
