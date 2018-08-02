goog.provide('plugin.file.shp.type.DBFTypeMethod');
goog.require('plugin.file.shp');
goog.require('plugin.file.shp.type.SHPTypeMethod');



/**
 * Type method for DBF content.
 * @extends {plugin.file.shp.type.SHPTypeMethod}
 * @constructor
 */
plugin.file.shp.type.DBFTypeMethod = function() {};
goog.inherits(plugin.file.shp.type.DBFTypeMethod, plugin.file.shp.type.SHPTypeMethod);


/**
 * @type {RegExp}
 * @const
 */
plugin.file.shp.type.DBFTypeMethod.EXT_REGEXP = /\.dbf$/i;


/**
 * @inheritDoc
 */
plugin.file.shp.type.DBFTypeMethod.prototype.isType = function(file, opt_zipEntries) {
  var content = file.getContent();
  var fileName = file.getFileName();

  if (content instanceof ArrayBuffer && fileName.match(plugin.file.shp.type.DBFTypeMethod.EXT_REGEXP)) {
    return plugin.file.shp.isDBFFileType(/** @type {ArrayBuffer} */ (content));
  }

  return false;
};
