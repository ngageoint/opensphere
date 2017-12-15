goog.provide('plugin.file.shp.type.SHPTypeMethod');
goog.require('os.file.IContentTypeMethod');
goog.require('plugin.file.shp');



/**
 * Type method for SHP content.
 * @implements {os.file.IContentTypeMethod}
 * @constructor
 */
plugin.file.shp.type.SHPTypeMethod = function() {};


/**
 * @type {RegExp}
 * @const
 */
plugin.file.shp.type.SHPTypeMethod.EXT_REGEXP = /\.shp$/i;


/**
 * @inheritDoc
 */
plugin.file.shp.type.SHPTypeMethod.prototype.getPriority = function() {
  return 0;
};


/**
 * @inheritDoc
 */
plugin.file.shp.type.SHPTypeMethod.prototype.getContentType = function() {
  return 'application/shapefile';
};


/**
 * @inheritDoc
 */
plugin.file.shp.type.SHPTypeMethod.prototype.getLayerType = function() {
  return 'SHP';
};


/**
 * @inheritDoc
 */
plugin.file.shp.type.SHPTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = file.getContent();
  var fileName = file.getFileName();

  if (content instanceof ArrayBuffer && fileName.match(plugin.file.shp.type.SHPTypeMethod.EXT_REGEXP)) {
    return plugin.file.shp.isSHPFileType(/** @type {ArrayBuffer} */ (content));
  }

  return false;
};
