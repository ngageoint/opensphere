goog.module('os.hist.IHistogramProvider');

const IHistogramData = goog.requireType('os.hist.IHistogramData');
const {default: TimelineScaleOptions} = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * @interface
 */
class IHistogramProvider {
  /**
   * @param {TimelineScaleOptions} options Histogram options
   * @return {?IHistogramData}
   */
  getHistogram(options) {}
}

/**
 * @type {string}
 * @const
 */
IHistogramProvider.ID = 'os.hist.IHistogramProvider';

exports = IHistogramProvider;
