goog.provide('os.hist.HistogramData');
goog.require('os.hist.AbstractHistogramData');
goog.require('os.hist.IHistogramData');



/**
 * Data representing a histogram for a single source.
 * @extends {os.hist.AbstractHistogramData}
 * @implements {os.hist.IHistogramData}
 * @constructor
 */
os.hist.HistogramData = function() {
  os.hist.HistogramData.base(this, 'constructor');

  /**
   * @type {!Object.<string, number>}
   * @private
   */
  this.counts_ = {};
};
goog.inherits(os.hist.HistogramData, os.hist.AbstractHistogramData);


/**
 * Get the counts for the histogram. Counts are represented as key/value pairs of the histogram bin
 * and its associated count.
 * @return {!Object.<string, number>}
 */
os.hist.HistogramData.prototype.getCounts = function() {
  return this.counts_;
};


/**
 * Set the counts for the histogram as key/value pairs.
 * @param {!Object.<string, number>} value
 */
os.hist.HistogramData.prototype.setCounts = function(value) {
  this.counts_ = value;
};
