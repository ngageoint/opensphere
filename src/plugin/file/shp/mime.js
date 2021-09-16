goog.module('plugin.file.shp.mime');

const Promise = goog.require('goog.Promise');

const mime = goog.require('os.file.mime');
const zip = goog.require('os.file.mime.zip');
const shp = goog.require('plugin.file.shp');


/**
 * @type {string}
 */
const TYPE = 'application/shapefile';

/**
 * @param {ArrayBuffer} buffer
 * @return {!goog.Promise<boolean>}
 */
const detect = function(buffer) {
  return /** @type {!goog.Promise<boolean>} */ (Promise.resolve(buffer && (shp.isSHPFileType(buffer) ||
      shp.isDBFFileType(buffer))));
};

/**
 * @type {string}
 */
const ZIP_TYPE = 'application/zip; subtype=shape';

/**
 * @type {RegExp}
 */
const SHP_EXT_REGEXP = /\.shp$/i;

/**
 * @type {RegExp}
 */
const DBF_EXT_REGEXP = /\.dbf$/i;

mime.register(TYPE, detect);
mime.register(ZIP_TYPE, zip.createDetect(/\.shp$/i), 0, zip.TYPE);

exports = {
  TYPE,
  detect,
  ZIP_TYPE,
  SHP_EXT_REGEXP,
  DBF_EXT_REGEXP
};
