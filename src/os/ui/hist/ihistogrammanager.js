goog.declareModuleId('os.ui.hist.IHistogramManager');

const {default: HistogramData} = goog.requireType('os.hist.HistogramData');
const {default: TimelineScaleOptions} = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Interface for the histogram managers
 *
 * @interface
 */
export default class IHistogramManager {
  /**
   * Gets the histogram
   * @param {TimelineScaleOptions} options Histogram options
   * @return {!Array<!HistogramData>}
   */
  getHistograms(options) {}
}
