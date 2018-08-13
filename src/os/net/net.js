goog.provide('os.net');
goog.provide('os.net.CrossOrigin');

goog.require('goog.Uri');
goog.require('goog.array');
goog.require('os.net.ExtDomainHandler');
goog.require('os.net.LocalFileHandler');
goog.require('os.net.ProxyHandler');
goog.require('os.net.SameDomainHandler');


/**
 * @enum {string}
 */
os.net.CrossOrigin = {
  ANONYMOUS: 'anonymous',
  USE_CREDENTIALS: 'use-credentials',
  NONE: 'none'
};


/**
 * @typedef {{
 *   pattern: RegExp,
 *   crossOrigin: os.net.CrossOrigin,
 *   priority: number
 * }}
 */
os.net.CrossOriginEntry;


/**
 * @type {!Array<os.net.CrossOriginEntry>}
 * @private
 */
os.net.crossOriginCache_ = [];


/**
 * Map of trusted URI regular expressions.
 * @type {!Array<!RegExp>}
 */
os.net.trustedURICache_ = [];


/**
 * The URI of the local page when it was launched.
 * @type {!goog.Uri}
 */
os.net.LOCAL_URI = new goog.Uri(window.location);


/**
 * Adds the default set of handlers to the factory.
 */
os.net.addDefaultHandlers = function() {
  os.net.RequestHandlerFactory.addHandler(os.net.LocalFileHandler);
  os.net.RequestHandlerFactory.addHandler(os.net.SameDomainHandler);
  os.net.RequestHandlerFactory.addHandler(os.net.ExtDomainHandler);
  os.net.RequestHandlerFactory.addHandler(os.net.ProxyHandler);
};


/**
 * Check if a crossOrigin value is valid.
 * @param {*} crossOrigin The value to check
 * @return {boolean} If the value is a valid crossOrigin
 */
os.net.isValidCrossOrigin = function(crossOrigin) {
  for (var key in os.net.CrossOrigin) {
    if (crossOrigin === os.net.CrossOrigin[key]) {
      return true;
    }
  }

  return false;
};


/**
 * Load the crossOrigin cache from config.
 */
os.net.loadCrossOriginCache = function() {
  os.net.crossOriginCache_.length = 0;

  var crossOrigin = /** @type {!Object} */ (os.settings.get('crossOrigin', {}));

  for (var id in crossOrigin) {
    var item = crossOrigin[id];
    os.net.registerCrossOrigin(item['pattern'], item['value'], item['priority'], true);
  }

  os.net.crossOriginCache_.sort(os.net.sortCache_);
};


/**
 * @param {os.net.CrossOriginEntry} a Thing 1
 * @param {os.net.CrossOriginEntry} b Thing 2
 * @return {number} per typical compare functions
 * @private
 */
os.net.sortCache_ = function(a, b) {
  return goog.array.defaultCompare(b.priority, a.priority);
};


/**
 * Get the crossOrigin value to use for a URI. Any URI not matching a registered cross origin cache pattern
 * will be assumed to be anonymous.
 *
 * @param {goog.Uri|string} uri The uri
 * @return {!os.net.CrossOrigin} The cross origin value to use for the URI
 */
os.net.getCrossOrigin = function(uri) {
  if (uri) {
    uri = goog.isString(uri) ? new goog.Uri(uri) : uri;

    var result = os.net.getCrossOriginInternal_(uri.toString());
    if (result) {
      return result;
    }

    if (uri.getDomain() && !uri.hasSameDomainAs(os.net.LOCAL_URI)) {
      return os.net.CrossOrigin.ANONYMOUS;
    }
  }

  return os.net.CrossOrigin.NONE;
};


/**
 * @param {string|RegExp} pattern
 * @param {os.net.CrossOrigin} crossOrigin
 * @param {number=} opt_priority
 * @param {boolean=} opt_skipSort
 */
os.net.registerCrossOrigin = function(pattern, crossOrigin, opt_priority, opt_skipSort) {
  opt_priority = opt_priority || 0;

  os.net.crossOriginCache_.push({
    pattern: goog.isString(pattern) ? new RegExp(pattern) : pattern,
    crossOrigin: crossOrigin,
    priority: opt_priority
  });

  if (!opt_skipSort) {
    os.net.crossOriginCache_.sort(os.net.sortCache_);
  }
};


/**
 * @param {string} pattern
 * @param {os.net.CrossOrigin} crossOrigin
 * @param {number=} opt_priority
 * @param {boolean=} opt_skipSort
 */
os.net.saveCrossOrigin = function(pattern, crossOrigin, opt_priority, opt_skipSort) {
  os.net.registerCrossOrigin(pattern, crossOrigin, opt_priority, opt_skipSort);

  // save to user settings
  var userCrossOrigin = /** @type {!Object} */ (os.settings.get('userCrossOrigin', {}));
  userCrossOrigin[goog.string.hashCode(pattern)] = {
    'pattern': pattern,
    'crossOrigin': crossOrigin,
    'priority': opt_priority || 0
  };

  os.settings.set('userCrossOrigin', userCrossOrigin);
};


/**
 * @param {string} url
 * @return {os.net.CrossOrigin|undefined}
 * @private
 */
os.net.getCrossOriginInternal_ = function(url) {
  var cache = os.net.crossOriginCache_;

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
os.net.loadTrustedUris = function() {
  var trustedUris = /** @type {!Object<string, boolean>} */ (os.settings.get('trustedUris', {}));
  var userTrustedUris = /** @type {!Object<string, boolean>} */ (os.settings.get('userTrustedUris', {}));
  os.object.merge(userTrustedUris, trustedUris, true);

  os.net.trustedURICache_.length = 0;

  for (var pattern in trustedUris) {
    os.net.addTrustedUri(pattern);
  }
};


/**
 * If content from a URI should be trusted for display in the DOM.
 * @param {goog.Uri|string|undefined} uri The uri.
 * @return {boolean} If content from the URI should be trusted.
 */
os.net.isTrustedUri = function(uri) {
  if (uri) {
    var cache = os.net.trustedURICache_;
    if (cache) {
      var url = goog.isString(uri) ? uri : uri.toString();
      return cache.some(function(pattern) {
        return pattern.test(url);
      });
    }
  }

  return false;
};


/**
 * Adds a trusted URI to the cache (does not save it to settings).
 * @param {string} uri The uri.
 */
os.net.addTrustedUri = function(uri) {
  os.net.trustedURICache_.push(new RegExp(uri));
};


/**
 * Add a URI to the trust cache and to the user's saved trusted URIs.
 * @param {goog.Uri|string} uri The uri.
 */
os.net.registerTrustedUri = function(uri) {
  if (uri) {
    var url = goog.isString(uri) ? uri : uri.toString();
    if (url) {
      os.net.addTrustedUri(url);

      // save to user settings
      var userTrustedUris = /** @type {!Object<string, boolean>} */ (os.settings.get('userTrustedUris', {}));
      userTrustedUris[url] = true;
      os.settings.set('userTrustedUris', userTrustedUris);
    }
  }
};


/**
 * If the browser supports sending a beacon in a beforeunload handler.
 * @return {boolean}
 */
os.net.supportsBeacon = function() {
  return typeof navigator.sendBeacon == 'function';
};


/**
 * If the browser supports sending a beacon in a beforeunload handler.
 * @param {string} url The URL to send to
 * @param {ArrayBufferView|Blob|FormData|null|string|undefined} data The data to send
 * @param {string=} opt_contentType The content type
 */
os.net.sendBeacon = function(url, data, opt_contentType) {
  if (os.net.supportsBeacon()) {
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
