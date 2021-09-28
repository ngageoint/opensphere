goog.declareModuleId('plugin.file.shp.mime');

import * as shp from './shp.js';

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const zip = goog.require('os.file.mime.zip');

/**
 * @type {string}
 */
export const TYPE = 'application/shapefile';

/**
 * @param {ArrayBuffer} buffer
 * @return {!goog.Promise<boolean>}
 */
export const detect = function(buffer) {
  return /** @type {!goog.Promise<boolean>} */ (Promise.resolve(buffer && (shp.isSHPFileType(buffer) ||
      shp.isDBFFileType(buffer))));
};

/**
 * @type {string}
 */
export const ZIP_TYPE = 'application/zip; subtype=shape';

/**
 * @type {RegExp}
 */
export const SHP_EXT_REGEXP = /\.shp$/i;

/**
 * @type {RegExp}
 */
export const DBF_EXT_REGEXP = /\.dbf$/i;

mime.register(TYPE, detect);
mime.register(ZIP_TYPE, zip.createDetect(/\.shp$/i), 0, zip.TYPE);
