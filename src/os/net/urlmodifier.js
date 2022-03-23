goog.declareModuleId('os.net.URLModifier');

import AbstractModifier from './abstractmodifier.js';

const Uri = goog.require('goog.Uri');


/**
 * URI parameter replacement modifier.
 */
export default class URLModifier extends AbstractModifier {
  /**
   * Constructor.
   * @param {string=} opt_id
   */
  constructor(opt_id) {
    super(opt_id || 'urlReplace', -110);
  }

  /**
   * Return the list of url modifiers
   * @return {!Array<{search: RegExp, replace: string}>}
   */
  getList() {
    return URLModifier.replace_;
  }

  /**
   * @inheritDoc
   */
  modify(uri) {
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

    var modifiedUri = new Uri(url + (keys.length ? '?' + qd.toString() : '') + (fragment ? '#' + fragment : ''));
    if (modifiedUri.toString() !== uri.toString()) {
      this.applyModifications(uri, modifiedUri);
    }
  }

  /**
   * @param {Uri} uri
   * @param {goog.Uri} modifiedUri
   */
  applyModifications(uri, modifiedUri) {
    uri.setScheme(modifiedUri.getScheme());
    uri.setDomain(modifiedUri.getDomain());
    uri.setPort(modifiedUri.getPort());
    uri.setPath(modifiedUri.getPath());
    uri.setQuery(modifiedUri.getQuery(), true);
    uri.setFragment(modifiedUri.getFragment());
  }

  /**
   * @param {?Object<string, string>} options
   */
  static configure(options) {
    if (options) {
      for (var pattern in options) {
        URLModifier.replace_.push({
          search: new RegExp(pattern),
          replace: options[pattern]
        });
      }
    } else {
      URLModifier.replace_ = [];
    }
  }
}


/**
 * @type {!Array<{search: RegExp, replace: string}>}
 * @private
 */
URLModifier.replace_ = [];
