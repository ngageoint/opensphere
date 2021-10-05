goog.declareModuleId('os.uri');

const Uri = goog.require('goog.Uri');
const QueryData = goog.requireType('goog.Uri.QueryData');


/**
 * Resolve a URI to a fully qualified URI if it's relative, otherwise leave it as is.
 *
 * @param {!string} uri
 * @return {string}
 */
export const addBase = function(uri) {
  if (window && window.location) {
    const origin = getWindowOrigin();
    const paramUri = new Uri(uri);
    const resultUri = paramUri.hasDomain() ? paramUri : Uri.resolve(origin, paramUri);
    return resultUri.toString();
  } else {
    return uri;
  }
};

/**
 * Get the browser's current URI with the provided query params.
 *
 * @param {QueryData} queryData The query params
 * @return {string}
 */
export const getParamUri = function(queryData) {
  return new Uri(window.location.toString()).setQueryData(queryData).toString();
};

/**
 * Get the window origin. This will return window.location.origin on most browsers, and will assemble the origin on
 * older browsers that do not support the property.
 * @return {string}
 */
export const getWindowOrigin = () => {
  if (window.location.origin) {
    return window.location.origin;
  }

  const port = window.location.port ? `:${window.location.port}` : '';
  return `${window.location.protocol}//${window.location.hostname}${port}`;
};

/**
 * Merges {@link QueryData} objects in a case insensitive manner.
 *
 * Uri.QueryData has a setIgnoreCase function, but if set to true it will lowercase all existing keys. This
 * preserves original case and only comparisons are insensitive.
 *
 * @param {goog.Uri.QueryData} from The source params
 * @param {goog.Uri.QueryData} to The target params
 * @param {boolean=} opt_overwrite If params should be replaced
 */
export const mergeParams = function(from, to, opt_overwrite) {
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
