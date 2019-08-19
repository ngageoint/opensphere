goog.provide('os.net.URLModifier');
goog.require('goog.Uri');
goog.require('os.net.AbstractModifier');



/**
 * URI parameter replacement modifier.
 *
 * @param {string=} opt_id
 * @extends {os.net.AbstractModifier}
 * @constructor
 */
os.net.URLModifier = function(opt_id) {
  os.net.URLModifier.base(this, 'constructor', opt_id || 'urlReplace', -110);
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
 * Return the list of url modifiers
 * @return {!Array<{search: RegExp, replace: string}>}
 */
os.net.URLModifier.prototype.getList = function() {
  return os.net.URLModifier.replace_;
};


/**
 * @inheritDoc
 */
os.net.URLModifier.prototype.modify = function(uri) {
  var list = this.getList();
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

  var modifiedUri = new goog.Uri(url + (keys.length ? '?' + qd.toString() : '') + (fragment ? '#' + fragment : ''));
  if (modifiedUri.toString() !== uri.toString()) {
    this.applyModifications(uri, modifiedUri);
  }
};


/**
 * @param {goog.Uri} uri
 * @param {goog.Uri} modifiedUri
 */
os.net.URLModifier.prototype.applyModifications = function(uri, modifiedUri) {
  uri.setScheme(modifiedUri.getScheme());
  uri.setDomain(modifiedUri.getDomain());
  uri.setPort(modifiedUri.getPort());
  uri.setPath(modifiedUri.getPath());
  uri.setQuery(modifiedUri.getQuery());
  uri.setFragment(modifiedUri.getFragment());
};
