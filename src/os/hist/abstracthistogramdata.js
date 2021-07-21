goog.module('os.hist.AbstractHistogramData');
goog.module.declareLegacyNamespace();

const IHistogramData = goog.requireType('os.hist.IHistogramData');
const TimeRange = goog.requireType('os.time.TimeRange');

/**
 * @type {string}
 */
const defaultColor = '#ffffff';

/**
 * Abstract class that should be extended by all histogram data classes. It deliberately
 * does not implement the count data structure in order to allow subclasses to do so.
 *
 * @abstract
 * @implements {IHistogramData}
 */
class AbstractHistogramData {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * @type {string}
     * @private
     */
    this.color_ = defaultColor;

    /**
     * @type {string|undefined}
     * @private
     */
    this.id_ = undefined;

    /**
     * @type {Object|undefined}
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
     * @type {?TimeRange}
     * @private
     */
    this.range_ = null;
  }

  /**
   * @inheritDoc
   */
  getColor() {
    return this.color_;
  }

  /**
   * @inheritDoc
   */
  setColor(value) {
    this.color_ = value;
  }

  /**
   * Get the id of the histogram.
   *
   * @return {string|undefined}
   */
  getId() {
    return this.id_;
  }

  /**
   * Set the id of the histogram.
   *
   * @param {string|undefined} value
   */
  setId(value) {
    this.id_ = value;
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    return this.options_;
  }

  /**
   * @inheritDoc
   */
  setOptions(value) {
    this.options_ = value;
  }

  /**
   * Get the title of the histogram.
   *
   * @return {string|undefined}
   */
  getTitle() {
    return this.title_;
  }

  /**
   * Set the title of the histogram.
   *
   * @param {string|undefined} value
   */
  setTitle(value) {
    this.title_ = value;
  }

  /**
   * Get the visibility of the histogram.
   *
   * @return {boolean}
   */
  getVisible() {
    return this.visible_;
  }

  /**
   * Set the visibility of the histogram.
   *
   * @param {boolean} value
   */
  setVisible(value) {
    this.visible_ = value;
  }

  /**
   * Get the full extent of the histogram
   *
   * @return {?TimeRange}
   */
  getRange() {
    return this.range_;
  }

  /**
   * Set the full extent of the histogram
   *
   * @param {?TimeRange} value
   */
  setRange(value) {
    this.range_ = value;
  }
}

exports = AbstractHistogramData;
