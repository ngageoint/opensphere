goog.provide('os.ui.hist.IHistogramChart');
goog.require('goog.disposable.IDisposable');
goog.require('os.hist.HistogramData');



/**
 * Interface for a chart driven by a histogram.
 * @extends {goog.disposable.IDisposable}
 * @interface
 */
os.ui.hist.IHistogramChart = function() {};


/**
 * Clears the chart if one is currently drawn.
 */
os.ui.hist.IHistogramChart.prototype.clear;


/**
 * Draws the chart, first clearing any previous one.
 * @param {!Array.<!os.hist.IHistogramData>} data The data to draw.
 * @param {d3.Scale} x The scale for the chart's x axis.
 * @param {d3.Scale} y The scale for the chart's y axis.
 * @param {Object=} opt_options Optional options for the histogram
 */
os.ui.hist.IHistogramChart.prototype.draw;


/**
 * Applies a tooltip to the chart.
 * @param {d3.Tip} tooltip The d3 tooltip instance.
 */
os.ui.hist.IHistogramChart.prototype.tooltip;
