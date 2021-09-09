goog.module('os.hist.HistogramData');

const AbstractHistogramData = goog.require('os.hist.AbstractHistogramData');
const IHistogramData = goog.requireType('os.hist.IHistogramData');


/**
 * Data representing a histogram for a single source.
 *
 * @implements {IHistogramData}
 */
class HistogramData extends AbstractHistogramData {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {!Object.<string, number>}
     * @private
     */
    this.counts_ = {};
  }

  /**
   * @inheritDoc
   */
  getCounts() {
    return this.counts_;
  }

  /**
   * @inheritDoc
   */
  setCounts(value) {
    this.counts_ = value;
  }
}

exports = HistogramData;
