goog.module('os.ogc.wps');

const QueryData = goog.requireType('goog.Uri.QueryData');


/**
 * This method preserves the parameter capitalization since some OGC servers do not implement the OGC spec and use
 * case-sensitive parameters.
 *
 * @param {!QueryData} params The params object
 * @param {string} key The key
 * @param {*} value The value
 * @param {boolean=} opt_replace If an existing param should be replaced. Defaults to true.
 */
const setParam = function(params, key, value, opt_replace) {
  var replace = opt_replace != null ? opt_replace : true;
  var lcKey = key.toLowerCase();
  var keys = params.getKeys();
  var foundKey = null;
  for (var i = 0, n = keys.length; i < n; i++) {
    if (keys[i].toLowerCase() == lcKey) {
      foundKey = keys[i];
      break;
    }
  }

  if (foundKey && replace) {
    params.set(foundKey, value);
  } else if (!foundKey) {
    params.set(key, value);
  }
};

exports = {
  setParam
};
