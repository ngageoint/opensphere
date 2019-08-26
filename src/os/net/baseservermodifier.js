goog.provide('os.net.BaseServerExpression');
goog.provide('os.net.BaseServerModifier');
goog.require('goog.Uri');
goog.require('os.net.URLModifier');



/**
 * @extends {os.net.URLModifier}
 * @constructor
 */
os.net.BaseServerModifier = function() {
  os.net.BaseServerModifier.base(this, 'constructor', 'baseServer');
};
goog.inherits(os.net.BaseServerModifier, os.net.URLModifier);


/**
 * @type {!Array<{search: RegExp, replace: string}>}
 * @private
 */
os.net.BaseServerModifier.replace_ = [];


/**
 * The expression to remove https and trailing slashes
 * @type {RegExp}
 */
os.net.BaseServerExpression = /(https:\/\/)?(.*[^\/])\/?/;


/**
 * @param {string} server
 */
os.net.BaseServerModifier.configure = function(server) {
  os.net.BaseServerModifier.replace_.length = 0;

  if (server) {
    os.net.BaseServerModifier.replace_.push({
      search: new RegExp(os.settings.get('baseServerRegex', '^\\/(.*)$')),
      replace: server.replace(/\/$/, '') + '/$1'
    });
  }
};


/**
 * @inheritDoc
 */
os.net.BaseServerModifier.prototype.getList = function() {
  return os.net.BaseServerModifier.replace_;
};


/**
 * Due to a bug in urlModifier changing the query,
 * lets decode the query to be correct without fixing bugs others might rely on
 * @inheritDoc
 */
os.net.BaseServerModifier.prototype.applyModifications = function(uri, modifiedUri) {
  uri.setScheme(modifiedUri.getScheme());
  uri.setDomain(modifiedUri.getDomain());
  uri.setPort(modifiedUri.getPort());
  uri.setPath(modifiedUri.getPath());
  /// ISSUE WITH URL ENCODER. It does getQuery which returns the encoded query
  uri.setQuery(modifiedUri.getQuery(), true);
  uri.setFragment(modifiedUri.getFragment());
};
