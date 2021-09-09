goog.module('os.hist.IHistogramData');

/**
 * Interface that should be implemented by all histogram data classes.
 *
 * @interface
 */
class IHistogramData {
  /**
   * Get the color of the histogram.
   * @return {string}
   */
  getColor() {}

  /**
   * Set the color of the histogram.
   * @param {string} value
   */
  setColor(value) {}

  /**
   * Gets the count object for the data.
   * @return {!Object}
   */
  getCounts() {}

  /**
   * Sets the count object for the data.
   * @param {!Object} value The count object
   */
  setCounts(value) {}

  /**
   * Get the options used to generate the histogram.
   * @return {Object|undefined}
   */
  getOptions() {}

  /**
   * Set the options used to generate the histogram.
   * @param {Object|undefined} value
   */
  setOptions(value) {}
}

exports = IHistogramData;
