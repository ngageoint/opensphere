goog.module('os.ui.hist.IHistogramManager');
goog.module.declareLegacyNamespace();

const HistogramData = goog.requireType('os.hist.HistogramData');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Interface for the histogram managers
 *
 * @interface
 */
class IHistogramManager {
  /**
   * Gets the histogram
   * @param {TimelineScaleOptions} options Histogram options
   * @return {!Array<!HistogramData>}
   */
  getHistograms(options) {}
}

exports = IHistogramManager;
