goog.provide('os.uri');
goog.require('goog.Uri');
goog.require('goog.Uri.QueryData');


/**
 * Resolve a URI to a fully qualified URI if it's relative, otherwise leave it as is.
 * @param {!string} uri
 * @return {string}
 */
os.uri.addBase = function(uri) {
  if (window && window.location) {
    if (!window.location.origin) {
      window.location.origin = window.location.protocol + '//' + window.location.hostname + (window.location.port ?
          ':' + window.location.port : '');
    }
    var paramUri = new goog.Uri(uri);
    var resultUri = paramUri.hasDomain() ? paramUri : goog.Uri.resolve(window.location.origin, paramUri);
    return resultUri.toString();
  } else {
    return uri;
  }
};


/**
 * Get the browser's current URI with the provided query params.
 * @param {goog.Uri.QueryData} queryData The query params
 * @return {string}
 */
os.uri.getParamUri = function(queryData) {
  return new goog.Uri(window.location.toString()).setQueryData(queryData).toString();
};


/**
 * Merges {@link goog.Uri.QueryData} objects in a case insensitive manner.
 *
 * goog.Uri.QueryData has a setIgnoreCase function, but if set to true it will lowercase all existing keys. This
 * preserves original case and only comparisons are insensitive.
 *
 * @param {goog.Uri.QueryData} from The source params
 * @param {goog.Uri.QueryData} to The target params
 * @param {boolean=} opt_overwrite If params should be replaced
 */
os.uri.mergeParams = function(from, to, opt_overwrite) {
  var fromKeys = from.getKeys();
  var toKeys = to.getKeys();
  for (var i = 0, n = fromKeys.length; i < n; i++) {
    var found = null;
    for (var j = 0, m = toKeys.length; j < m; j++) {
      if (fromKeys[i].toLowerCase() == toKeys[j].toLowerCase()) {
        found = toKeys[j];
        break;
      }
    }

    if (!found) {
      // doesn't exist, go ahead an add it
      to.set(fromKeys[i], from.get(fromKeys[i]));
    } else if (opt_overwrite) {
      // preserve the original case of the param
      to.set(found, from.get(fromKeys[i]));
    }
  }
};
