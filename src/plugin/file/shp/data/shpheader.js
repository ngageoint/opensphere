goog.provide('plugin.file.shp.data.SHPHeader');
goog.require('plugin.file.shp.data.DBFHeader');
goog.require('plugin.file.shp.data.SHXHeader');



/**
 * @constructor
 */
plugin.file.shp.data.SHPHeader = function() {
  /**
   * @type {ArrayBuffer}
   */
  this.data = null;

  /**
   * @type {plugin.file.shp.data.DBFHeader}
   */
  this.dbf = new plugin.file.shp.data.DBFHeader();

  /**
   * @type {plugin.file.shp.data.SHXHeader}
   */
  this.shx = new plugin.file.shp.data.SHXHeader();

  /**
   * @type {number}
   */
  this.curRecord = 0;

  /**
   * @type {number}
   */
  this.position = 0;

  /**
   * Since we use an array buffer, we have to know how big it is before writing to it
   * @type {number}
   */
  this.allocation = 0;
};
