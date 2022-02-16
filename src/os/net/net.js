goog.declareModuleId('os.net');

import {defaultSort} from '../array/array.js';
import {registerClass} from '../classregistry.js';
import {getSettings} from '../config/configinstance.js';
import instanceOf from '../instanceof.js';
import {merge} from '../object/object.js';
import CrossOrigin from './crossorigin.js';

const Uri = goog.require('goog.Uri');
const QueryData = goog.require('goog.Uri.QueryData');
const {hashCode} = goog.require('goog.string');


/**
 * @type {string}
 */
QueryData.NAME = 'goog.Uri.QueryData';

// register {@link QueryData} to allow type checking QueryData objects created in the external window
registerClass(QueryData.NAME, QueryData);


/**
 * @typedef {{
 *   pattern: RegExp,
 *   crossOrigin: CrossOrigin,
 *   priority: number
 * }}
 */
export let CrossOriginEntry;

/**
 * @typedef {function((ArrayBuffer|string), ?string=, Array<number>=):?string}
 */
export let RequestValidator;

/**
 * @typedef {{
 *   validator: !RequestValidator,
 *   priority: number
 * }}
 */
export let RequestValidatorEntry;

/**
 * @type {!Array<CrossOriginEntry>}
 */
const crossOriginCache_ = [];

/**
 * List of default request validators.
 * @type {!Array<!RequestValidatorEntry>}
 */
export const defaultValidators = [];

/**
 * Map of trusted URI regular expressions.
 * @type {!Array<!RegExp>}
 */
export const trustedURICache = [];

/**
 * The URI of the local page when it was launched.
 * @type {!Uri}
 */
export const LOCAL_URI = new Uri(window.location);

/**
 * Get the default request validators.
 * @return {!Array<!RequestValidator>}
 */
export const getDefaultValidators = function() {
  return defaultValidators.map((entry) => entry.validator);
};

/**
 * Register a request validator. The validator should process response data and return an error if found, otherwise it
 * should return null or an empty string.
 * @param {!RequestValidator} validator The validation function.
 * @param {number=} opt_priority The priority. Defaults to 0, higher priority will execute first.
 * @param {boolean=} opt_skipSort If sorting should be skipped.
 */
export const registerDefaultValidator = function(validator, opt_priority = 0, opt_skipSort = false) {
  defaultValidators.push({
    validator,
    priority: opt_priority
  });

  if (!opt_skipSort) {
    defaultValidators.sort(sortValidators_);
  }
};

/**
 * Reset the default request validators.
 */
export const resetDefaultValidators = function() {
  defaultValidators.length = 0;
};

/**
 * Sort request validator entries.
 * @param {RequestValidatorEntry} a Thing 1
 * @param {RequestValidatorEntry} b Thing 2
 * @return {number} per typical compare functions
 */
const sortValidators_ = function(a, b) {
  return b.priority - a.priority;
};

/**
 * Check if a crossOrigin value is valid.
 *
 * @param {*} crossOrigin The value to check
 * @return {boolean} If the value is a valid crossOrigin
 */
export const isValidCrossOrigin = function(crossOrigin) {
  for (var key in CrossOrigin) {
    if (crossOrigin === CrossOrigin[key]) {
      return true;
    }
  }

  return false;
};

/**
 * Load the crossOrigin cache from config.
 */
export const loadCrossOriginCache = function() {
  resetCrossOriginCache();

  var crossOrigin = /** @type {!Object} */ (getSettings().get('crossOrigin', {}));

  for (var id in crossOrigin) {
    var item = crossOrigin[id];
    registerCrossOrigin(item['pattern'], item['value'], item['priority'], true);
  }

  crossOriginCache_.sort(sortCache_);
};

/**
 * @param {CrossOriginEntry} a Thing 1
 * @param {CrossOriginEntry} b Thing 2
 * @return {number} per typical compare functions
 */
const sortCache_ = function(a, b) {
  return defaultSort(b.priority, a.priority);
};

/**
 * Get the crossOrigin value to use for a URI. Any URI not matching a registered cross origin cache pattern
 * will be assumed to be anonymous.
 *
 * @param {Uri|string} uri The uri
 * @return {!CrossOrigin} The cross origin value to use for the URI
 */
let getCrossOriginFn = function(uri) {
  if (uri) {
    uri = typeof uri === 'string' ? new Uri(uri) : uri;

    var result = getCrossOriginInternal(uri.toString());
    if (result) {
      return result;
    }

    if (uri.getDomain() && !uri.hasSameDomainAs(LOCAL_URI)) {
      return CrossOrigin.ANONYMOUS;
    }
  }

  return CrossOrigin.NONE;
};

/**
 * Set the function used to get the cross origin.
 * @param {function((Uri|string)):!CrossOrigin} fn The function.
 */
export const setGetCrossOriginFn = (fn) => {
  getCrossOriginFn = fn;
};

/**
 * Get the crossOrigin value to use for a URI. Any URI not matching a registered cross origin cache pattern
 * will be assumed to be anonymous.
 *
 * @param {Uri|string} uri The uri
 * @return {!CrossOrigin} The cross origin value to use for the URI
 */
export const getCrossOrigin = function(uri) {
  return getCrossOriginFn(uri);
};

/**
 * @param {string|RegExp} pattern
 * @param {CrossOrigin} crossOrigin
 * @param {number=} opt_priority
 * @param {boolean=} opt_skipSort
 */
export const registerCrossOrigin = function(pattern, crossOrigin, opt_priority, opt_skipSort) {
  opt_priority = opt_priority || 0;

  crossOriginCache_.push({
    pattern: typeof pattern === 'string' ? new RegExp(pattern) : pattern,
    crossOrigin: crossOrigin,
    priority: opt_priority
  });

  if (!opt_skipSort) {
    crossOriginCache_.sort(sortCache_);
  }
};

/**
 * Reset the cross origin cache.
 */
export const resetCrossOriginCache = function() {
  crossOriginCache_.length = 0;
};

/**
 * @param {string} pattern
 * @param {CrossOrigin} crossOrigin
 * @param {number=} opt_priority
 * @param {boolean=} opt_skipSort
 */
export const saveCrossOrigin = function(pattern, crossOrigin, opt_priority, opt_skipSort) {
  registerCrossOrigin(pattern, crossOrigin, opt_priority, opt_skipSort);

  // save to user settings
  var userCrossOrigin = /** @type {!Object} */ (getSettings().get('userCrossOrigin', {}));
  userCrossOrigin[hashCode(pattern)] = {
    'pattern': pattern,
    'crossOrigin': crossOrigin,
    'priority': opt_priority || 0
  };

  getSettings().set('userCrossOrigin', userCrossOrigin);
};

/**
 * @param {string} url
 * @return {CrossOrigin|undefined}
 */
const getCrossOriginInternal = function(url) {
  var cache = crossOriginCache_;

  if (cache) {
    for (var i = 0, n = cache.length; i < n; i++) {
      if (cache[i].pattern.test(url)) {
        return cache[i].crossOrigin;
      }
    }
  }
};

/**
 * Load trusted URI patterns from config.
 */
export const loadTrustedUris = function() {
  var trustedUris = /** @type {!Object<string, boolean>} */ (getSettings().get('trustedUris', {}));
  var userTrustedUris = /** @type {!Object<string, boolean>} */ (getSettings().get('userTrustedUris', {}));
  merge(userTrustedUris, trustedUris, true);

  trustedURICache.length = 0;

  for (var pattern in trustedUris) {
    addTrustedUri(pattern);
  }
};

/**
 * If content from a URI should be trusted for display in the DOM.
 *
 * @param {Uri|string|undefined} uri The uri.
 * @return {boolean} If content from the URI should be trusted.
 */
export const isTrustedUri = function(uri) {
  if (uri) {
    var cache = trustedURICache;
    if (cache) {
      var url = typeof uri === 'string' ? uri : uri.toString();
      return cache.some(function(pattern) {
        return pattern.test(url);
      });
    }
  }

  return false;
};

/**
 * Adds a trusted URI to the cache (does not save it to settings).
 *
 * @param {string} uri The uri.
 */
export const addTrustedUri = function(uri) {
  trustedURICache.push(new RegExp(uri));
};

/**
 * Add a URI to the trust cache and to the user's saved trusted URIs.
 *
 * @param {Uri|string} uri The uri.
 */
export const registerTrustedUri = function(uri) {
  if (uri) {
    var url = typeof uri === 'string' ? uri : uri.toString();
    if (url) {
      addTrustedUri(url);

      // save to user settings
      var userTrustedUris = /** @type {!Object<string, boolean>} */ (getSettings().get('userTrustedUris', {}));
      userTrustedUris[url] = true;
      getSettings().set('userTrustedUris', userTrustedUris);
    }
  }
};

/**
 * If the browser supports sending a beacon in a beforeunload handler.
 *
 * @return {boolean}
 */
export const supportsBeacon = function() {
  return typeof navigator.sendBeacon == 'function';
};

/**
 * If the browser supports sending a beacon in a beforeunload handler.
 *
 * @param {string} url The URL to send to
 * @param {ArrayBufferView|Blob|FormData|null|string|undefined} data The data to send
 * @param {string=} opt_contentType The content type
 */
export const sendBeacon = function(url, data, opt_contentType) {
  if (supportsBeacon()) {
    try {
      if (opt_contentType) {
        data = new Blob([data], {'type': opt_contentType});
      }

      navigator.sendBeacon(url, data);
    } catch (e) {
      console.log('failed sending beacon', e);
    }
  }
};

/**
 * Gets a query data object for a set of params.
 *
 * @param {string|QueryData|Object|undefined} params The params.
 * @return {!Uri.QueryData} The query data.
 */
export const paramsToQueryData = function(params) {
  var qd;

  if (typeof params === 'string') {
    qd = new QueryData(params);
  } else if (instanceOf(params, QueryData.NAME)) {
    qd = /** @type {QueryData} */ (params);
  } else {
    // create a new one from the object or an empty one
    qd = goog.isObject(params) ? QueryData.createFromMap(params) : null;
  }

  return qd || new QueryData();
};
