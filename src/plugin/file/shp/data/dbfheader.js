goog.provide('plugin.file.shp.data.DBFHeader');
goog.require('plugin.file.shp.data.DBFField');



/**
 * @constructor
 */
plugin.file.shp.data.DBFHeader = function() {
  /**
   * @type {ArrayBuffer}
   */
  this.data = null;

  /**
   * @type {number}
   */
  this.numRecords = 0;

  /**
   * @type {number}
   */
  this.recordSize = 0;

  /**
   * @type {number}
   */
  this.recordStart = 0;

  /**
   * @type {Array.<plugin.file.shp.data.DBFField>}
   */
  this.fields = [];

  /**
   * Since we use an array buffer, we have to know how big it is before writing to it
   * @type {number}
   */
  this.allocation = 0;
};
