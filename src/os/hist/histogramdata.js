goog.declareModuleId('os.hist.HistogramData');

import AbstractHistogramData from './abstracthistogramdata.js';
const {default: IHistogramData} = goog.requireType('os.hist.IHistogramData');


/**
 * Data representing a histogram for a single source.
 *
 * @implements {IHistogramData}
 */
export default class HistogramData extends AbstractHistogramData {
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
