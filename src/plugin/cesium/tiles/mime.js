goog.provide('plugin.cesium.tiles.mime');

goog.require('goog.Promise');
goog.require('os.file.mime.json');

/**
 * @const
 * @type {string}
 */
plugin.cesium.tiles.mime.TYPE = 'application/vnd.tileset+json';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.cesium.tiles.mime.isTilesetJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && plugin.cesium.tiles.mime.find_(/** @type {Object|null} */ (opt_context))) {
    retVal = opt_context;
  }

  return goog.Promise.resolve(retVal);
};


/**
 * @param {Array|Object} obj
 * @return {boolean}
 * @private
 */
plugin.cesium.tiles.mime.find_ = function(obj) {
  // geometricError is the only required property by spec, but also require a root tile
  return typeof obj['geometricError'] === 'number' &&
      obj['root'] && typeof obj['root']['geometricError'] === 'number';
};

os.file.mime.register(
    plugin.cesium.tiles.mime.TYPE,
    plugin.cesium.tiles.mime.isTilesetJSON,
    1000,
    os.file.mime.json.TYPE);
