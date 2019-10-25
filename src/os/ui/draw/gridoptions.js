goog.provide('os.ui.draw.GridOptions');

goog.require('ol.style.Style');
goog.require('os.style.area');


/**
 * Config class to store settings for grid capabilities
 *
 * @param {number} detail The number of degrees squared used to draw the grid
 * @param {number} max The maximum number of grid squares to draw
 * @constructor
 */
os.ui.draw.GridOptions = function(detail, max) {
  /**
   * @type {number}
   * @protected
   */
  this.detail = (detail) ? detail : os.ui.draw.getGridSetting(os.ui.draw.GRID_DETAIL, 1.0);

  /**
   * @type {number}
   * @protected
   */
  this.max = (max) ? max : os.ui.draw.getGridSetting(os.ui.draw.GRID_DETAIL_MAX, 100.0);

  /**
   * @type {ol.style.Style} style
   */
  this.style = os.style.area.GRID_STYLE;
};


/**
 * @return {number}
 */
os.ui.draw.GridOptions.prototype.getDetail = function() {
  return this.detail;
};


/**
 * @param {number} detail
 */
os.ui.draw.GridOptions.prototype.setDetail = function(detail) {
  this.detail = detail;
};


/**
 * @return {number}
 */
os.ui.draw.GridOptions.prototype.getMax = function() {
  return this.max;
};


/**
 * @param {number} max
 */
os.ui.draw.GridOptions.prototype.setMax = function(max) {
  this.max = max;
};


/**
 * @return {ol.style.Style}
 */
os.ui.draw.GridOptions.prototype.getStyle = function() {
  return this.style;
};


/**
 * @param {ol.style.Style} style
 */
os.ui.draw.GridOptions.prototype.setStyle = function(style) {
  this.style = style;
};


/**
 * Helper function; gets a numeric representation of the JSON setting
 *
 * @param {string} key
 * @param {number} defaultValue
 * @return {number}
 */
os.ui.draw.getGridSetting = function(key, defaultValue) {
  var value = defaultValue;
  try {
    value = parseFloat(os.settings.get(key, defaultValue));
  } catch (e) {
    // do nothing
  }
  return value;
};
