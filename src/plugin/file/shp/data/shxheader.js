goog.provide('plugin.file.shp.data.SHXHeader');



/**
 * @constructor
 */
plugin.file.shp.data.SHXHeader = function() {
  /**
   * @type {ArrayBuffer}
   */
  this.data = null;

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
