goog.module('os.hist.IHistogramProvider');
goog.module.declareLegacyNamespace();

const IHistogramData = goog.requireType('os.hist.IHistogramData');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');

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
