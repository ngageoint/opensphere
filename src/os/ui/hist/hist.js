goog.declareModuleId('os.ui.hist');

import LineChart from './linechart.js';
import StackedBarChart from './stackedbarchart.js';

const {default: IHistogramChart} = goog.requireType('os.ui.hist.IHistogramChart');


/**
 * Convenience mapping of chart type to constructor.
 * @type {Object<string, function(new: IHistogramChart, !Element)>}
 */
export const CHART_TYPES = {
  'line': LineChart,
  'stackedBar': StackedBarChart
};
