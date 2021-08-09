goog.module('os.ui.hist');
goog.module.declareLegacyNamespace();

const LineChart = goog.require('os.ui.hist.LineChart');
const StackedBarChart = goog.require('os.ui.hist.StackedBarChart');

const IHistogramChart = goog.requireType('os.ui.hist.IHistogramChart');


/**
 * Convenience mapping of chart type to constructor.
 * @type {Object<string, function(new: IHistogramChart, !Element)>}
 */
const CHART_TYPES = {
  'line': LineChart,
  'stackedBar': StackedBarChart
};

exports = {
  CHART_TYPES
};
