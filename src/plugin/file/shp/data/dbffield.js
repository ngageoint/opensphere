goog.provide('plugin.file.shp.data.DBFField');



/**
 * @param {string} name
 * @param {string} type
 * @param {number} length
 * @constructor
 */
plugin.file.shp.data.DBFField = function(name, type, length) {
  /**
   * @type {string}
   */
  this.name = name;

  /**
   * @type {string}
   */
  this.type = type;

  /**
   * @type {number}
   */
  this.length = length;
};
