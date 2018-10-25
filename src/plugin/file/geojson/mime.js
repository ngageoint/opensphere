goog.provide('plugin.file.geojson.mime');

goog.require('goog.Promise');
goog.require('os.file.mime.json');

/**
 * @const
 * @type {string}
 */
plugin.file.geojson.mime.TYPE = 'application/vnd.geo+json';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.file.geojson.mime.isGeoJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && plugin.file.geojson.mime.find_(/** @type {Object|null} */ (opt_context))) {
    retVal = opt_context;
  }

  return goog.Promise.resolve(retVal);
};


/**
 * @param {Array|Object} obj
 * @return {boolean}
 * @private
 */
plugin.file.geojson.mime.find_ = function(obj) {
  if (obj['type'] === 'FeatureCollection' || obj['type'] === 'Feature') {
    return true;
  }

  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var val = obj[key];
      if (goog.isObject(val) || Array.isArray(val)) {
        var retVal = plugin.file.geojson.mime.find_(val);
        if (retVal) {
          return retVal;
        }
      }
    }
  }

  return false;
};


os.file.mime.register(plugin.file.geojson.mime.TYPE, plugin.file.geojson.mime.isGeoJSON, 0, os.file.mime.json.TYPE);
