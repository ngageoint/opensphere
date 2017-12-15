goog.provide('os.ui.hist');
goog.provide('os.ui.hist.HistogramEventType');
goog.require('os.ui.hist.IHistogramChart');
goog.require('os.ui.hist.LineChart');
goog.require('os.ui.hist.StackedBarChart');


/**
 * Convenience mapping of chart type to constructor.
 * @type {Object.<string, function(new: os.ui.hist.IHistogramChart, !Element)>}
 * @const
 */
os.ui.hist.CHART_TYPES = {
  'line': os.ui.hist.LineChart,
  'stackedBar': os.ui.hist.StackedBarChart
};


/**
 * @enum {string}
 */
os.ui.hist.HistogramEventType = {
  CHANGE: 'histogramChange'
};
