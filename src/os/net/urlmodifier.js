goog.provide('os.net.URLModifier');
goog.require('goog.Uri');
goog.require('os.net.AbstractModifier');



/**
 * URI parameter replacement modifier.
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.net.URLModifier = function() {
  os.net.URLModifier.base(this, 'constructor', 'urlReplace', -110);
};
goog.inherits(os.net.URLModifier, os.net.AbstractModifier);


/**
 * @type {!Array<{search: RegExp, replace: string}>}
 * @private
 */
os.net.URLModifier.replace_ = [];


/**
 * @param {?Object<string, string>} options
 */
os.net.URLModifier.configure = function(options) {
  os.net.URLModifier.replace_.length = 0;

  if (options) {
    for (var pattern in options) {
      os.net.URLModifier.replace_.push({
        search: new RegExp(pattern),
        replace: options[pattern]
      });
    }
  }
};


/**
 * @inheritDoc
 */
os.net.URLModifier.prototype.modify = function(uri) {
  // search patterns are generally given unencoded
  var url = decodeURIComponent(uri.toString());
  var list = os.net.URLModifier.replace_;

  for (var i = 0, n = list.length; i < n; i++) {
    url = url.replace(list[i].search, list[i].replace);
  }

  var u = new goog.Uri(url);
  if (url !== uri.toString()) {
    uri.setScheme(u.getScheme());
    uri.setDomain(u.getDomain());
    uri.setPort(u.getPort());
    uri.setPath(u.getPath());
    uri.setQuery(u.getQuery());
    uri.setFragment(u.getFragment());
  }
};
