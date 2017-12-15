goog.provide('os.hist.AbstractHistogramData');
goog.require('os.hist.IHistogramData');



/**
 * Abstract class that should be extended by all histogram data classes. It deliberately
 * does not implement the count data structure in order to allow subclasses to do so.
 * @implements {os.hist.IHistogramData}
 * @constructor
 */
os.hist.AbstractHistogramData = function() {
  /**
   * @type {string}
   * @private
   */
  this.color_ = os.hist.AbstractHistogramData.DEFAULT_COLOR_;

  /**
   * @type {string|undefined}
   * @private
   */
  this.id_ = undefined;

  /**
   * @type {Object.<string, *>|undefined}
   * @private
   */
  this.options_ = undefined;

  /**
   * @type {string|undefined}
   * @private
   */
  this.title_ = undefined;

  /**
   * @type {boolean}
   * @private
   */
  this.visible_ = false;

  /**
   * @type {?os.time.TimeRange}
   * @private
   */
  this.range_ = null;
};


/**
 * @inheritDoc
 */
os.hist.AbstractHistogramData.prototype.getCounts = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.hist.AbstractHistogramData.prototype.setCounts = goog.abstractMethod;


/**
 * @type {string}
 * @const
 * @private
 */
os.hist.AbstractHistogramData.DEFAULT_COLOR_ = '#ffffff';


/**
 * Get the color of the histogram.
 * @return {string}
 */
os.hist.AbstractHistogramData.prototype.getColor = function() {
  return this.color_;
};


/**
 * Set the color of the histogram.
 * @param {string} value
 */
os.hist.AbstractHistogramData.prototype.setColor = function(value) {
  this.color_ = value;
};


/**
 * Get the id of the histogram.
 * @return {string|undefined}
 */
os.hist.AbstractHistogramData.prototype.getId = function() {
  return this.id_;
};


/**
 * Set the id of the histogram.
 * @param {string|undefined} value
 */
os.hist.AbstractHistogramData.prototype.setId = function(value) {
  this.id_ = value;
};


/**
 * Get the options used to generate the histogram.
 * @return {Object.<string, *>|undefined}
 */
os.hist.AbstractHistogramData.prototype.getOptions = function() {
  return this.options_;
};


/**
 * Set the options used to generate the histogram.
 * @param {Object.<string, *>|undefined} value
 */
os.hist.AbstractHistogramData.prototype.setOptions = function(value) {
  this.options_ = value;
};


/**
 * Get the title of the histogram.
 * @return {string|undefined}
 */
os.hist.AbstractHistogramData.prototype.getTitle = function() {
  return this.title_;
};


/**
 * Set the title of the histogram.
 * @param {string|undefined} value
 */
os.hist.AbstractHistogramData.prototype.setTitle = function(value) {
  this.title_ = value;
};


/**
 * Get the visibility of the histogram.
 * @return {boolean}
 */
os.hist.AbstractHistogramData.prototype.getVisible = function() {
  return this.visible_;
};


/**
 * Set the visibility of the histogram.
 * @param {boolean} value
 */
os.hist.AbstractHistogramData.prototype.setVisible = function(value) {
  this.visible_ = value;
};


/**
 * Get the full extent of the histogram
 * @return {?os.time.TimeRange}
 */
os.hist.AbstractHistogramData.prototype.getRange = function() {
  return this.range_;
};


/**
 * Set the full extent of the histogram
 * @param {?os.time.TimeRange} value
 */
os.hist.AbstractHistogramData.prototype.setRange = function(value) {
  this.range_ = value;
};
