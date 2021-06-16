goog.provide('os.hist.IHistogramProvider');

goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * @interface
 */
os.hist.IHistogramProvider = function() {};

/**
 * @type {string}
 * @const
 */
os.hist.IHistogramProvider.ID = 'os.hist.IHistogramProvider';

/**
 * @param {os.ui.timeline.TimelineScaleOptions} options Histogram options
 * @return {?os.hist.IHistogramData}
 */
os.hist.IHistogramProvider.prototype.getHistogram;
