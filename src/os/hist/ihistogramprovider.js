goog.declareModuleId('os.hist.IHistogramProvider');

const {default: IHistogramData} = goog.requireType('os.hist.IHistogramData');
const {default: TimelineScaleOptions} = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * @interface
 */
export default class IHistogramProvider {
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
