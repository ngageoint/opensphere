goog.provide('plugin.file.shp.mime');

goog.require('os.file.mime');
goog.require('os.file.mime.zip');
goog.require('plugin.file.shp');



/**
 * @type {string}
 * @const
 */
plugin.file.shp.mime.TYPE = 'application/shapefile';


/**
 * @param {ArrayBuffer} buffer
 * @return {!goog.Promise<boolean>}
 */
plugin.file.shp.mime.detect = function(buffer) {
  return /** @type {!goog.Promise<boolean>} */ (goog.Promise.resolve(buffer && (plugin.file.shp.isSHPFileType(buffer) ||
      plugin.file.shp.isDBFFileType(buffer))));
};


os.file.mime.register(plugin.file.shp.mime.TYPE, plugin.file.shp.mime.detect);

/**
 * @type {string}
 * @const
 */
plugin.file.shp.mime.ZIP_TYPE = 'application/zip; subtype=shape';


os.file.mime.register(
    plugin.file.shp.mime.ZIP_TYPE,
    os.file.mime.zip.createDetect(/\.shp$/i),
    0, os.file.mime.zip.TYPE);


/**
 * @type {RegExp}
 * @const
 */
plugin.file.shp.mime.SHP_EXT_REGEXP = /\.shp$/i;


/**
 * @type {RegExp}
 * @const
 */
plugin.file.shp.mime.DBF_EXT_REGEXP = /\.dbf$/i;
