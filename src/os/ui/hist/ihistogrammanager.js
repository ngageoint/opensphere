goog.provide('os.ui.hist.IHistogramManager');
goog.require('goog.events.Listenable');



/**
 * Interface for the histogram managers
 * @interface
 */
os.ui.hist.IHistogramManager = function() {};


/**
 * Gets the histogram
 * @param {os.ui.timeline.TimelineScaleOptions} options Histogram options
 * @return {!Array.<!os.hist.HistogramData>}
 */

os.ui.hist.IHistogramManager.prototype.getHistograms;
