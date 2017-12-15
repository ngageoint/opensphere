goog.provide('plugin.file.shp.type.ZipSHPTypeMethod');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.type.ZipTypeMethod');



/**
 * Type method for compressed SHP content.
 * @extends {os.file.type.ZipTypeMethod}
 * @constructor
 */
plugin.file.shp.type.ZipSHPTypeMethod = function() {
  plugin.file.shp.type.ZipSHPTypeMethod.base(this, 'constructor');
  this.log = plugin.file.shp.type.ZipSHPTypeMethod.LOGGER_;
  this.regex = /\.shp$/i;
};
goog.inherits(plugin.file.shp.type.ZipSHPTypeMethod, os.file.type.ZipTypeMethod);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.shp.type.ZipSHPTypeMethod.LOGGER_ = goog.log.getLogger('plugin.file.shp.type.ZipSHPTypeMethod');


/**
 * @inheritDoc
 */
plugin.file.shp.type.ZipSHPTypeMethod.prototype.getContentType = function() {
  return 'application/zip; subtype=shape';
};


/**
 * @inheritDoc
 */
plugin.file.shp.type.ZipSHPTypeMethod.prototype.getLayerType = function() {
  return 'ZIPSHP';
};
