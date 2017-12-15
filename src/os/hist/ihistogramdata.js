goog.provide('os.hist.IHistogramData');



/**
 * Interface that should be implemented by all histogram data classes.
 * @interface
 */
os.hist.IHistogramData = function() {};


/**
 * Gets the count object for the data
 * @return {!Object}
 */
os.hist.IHistogramData.prototype.getCounts;


/**
 * Sets the count object for the data
 * @param {!Object} value The count object
 */
os.hist.IHistogramData.prototype.setCounts;
