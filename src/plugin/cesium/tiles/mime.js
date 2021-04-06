goog.module('plugin.cesium.tiles.mime');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const {register} = goog.require('os.file.mime');
const json = goog.require('os.file.mime.json');


/**
 * @type {string}
 */
const TYPE = 'application/vnd.tileset+json';

/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const isTilesetJSON = function(buffer, opt_file, opt_context) {
  var retVal;

  if (opt_context && testContext(/** @type {Object|null} */ (opt_context))) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

/**
 * @param {Array|Object} obj
 * @return {boolean}
 */
const testContext = function(obj) {
  // geometricError is the only required property by spec, but also require a root tile
  return typeof obj['geometricError'] === 'number' &&
      obj['root'] && typeof obj['root']['geometricError'] === 'number';
};

register(TYPE, isTilesetJSON, 1000, json.TYPE);

exports = {
  TYPE,
  isTilesetJSON
};
