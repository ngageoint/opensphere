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
  var list = os.net.URLModifier.replace_;
  if (!list.length) {
    return;
  }

  var url = uri.toString().replace(/[?#].*$/, '');
  var qd = uri.getQueryData();
  var keys = qd.getKeys();
  var fragment = uri.getFragment();

  for (var i = 0, ii = list.length; i < ii; i++) {
    url = url.replace(list[i].search, list[i].replace);
    fragment = fragment.replace(list[i].search, list[i].replace);

    if (keys) {
      for (var j = 0, jj = keys.length; j < jj; j++) {
        var key = keys[j];
        var value = qd.get(key);

        if (value) {
          var newValue = value.toString().replace(list[i].search, list[i].replace);

          if (newValue != value) {
            qd.set(key, newValue);
          }
        }
      }
    }
  }

  var u = new goog.Uri(url + (keys.length ? '?' + qd.toString() : '') + (fragment ? '#' + fragment : ''));
  if (u.toString() !== uri.toString()) {
    uri.setScheme(u.getScheme());
    uri.setDomain(u.getDomain());
    uri.setPort(u.getPort());
    uri.setPath(u.getPath());
    uri.setQuery(u.getQuery());
    uri.setFragment(u.getFragment());
  }
};
