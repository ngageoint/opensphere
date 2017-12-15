goog.provide('os.data.CountBin');

goog.require('goog.array');
goog.require('os.data.histo.ColorBin');



/**
 * Histogram bin that only manages a count.
 * @param {string} baseColor The base color of the layer represented by this bin
 * @extends {os.data.histo.ColorBin}
 * @constructor
 */
os.data.CountBin = function(baseColor) {
  os.data.CountBin.base(this, 'constructor', baseColor);

  /**
   * @type {number}
   */
  this.count = 0;
};
goog.inherits(os.data.CountBin, os.data.histo.ColorBin);


/**
 * @inheritDoc
 */
os.data.CountBin.prototype.addItem = function(item) {
  this.count++;
};


/**
 * @inheritDoc
 */
os.data.CountBin.prototype.removeItem = function(item) {
  this.count--;
};


/**
 * @param {number} value
 */
os.data.CountBin.prototype.setCount = function(value) {
  this.count = value;
};


/**
 * @inheritDoc
 */
os.data.CountBin.prototype.getCount = function() {
  return this.count;
};


/**
 * @inheritDoc
 */
os.data.CountBin.prototype.clear = function() {
  this.items.length = 0;
  this.count = 0;
};


/**
 * @inheritDoc
 */
os.data.CountBin.prototype.getColorCounts = function() {
  var counts = {};
  counts[this.getColor()] = this.getCount();
  return counts;
};
