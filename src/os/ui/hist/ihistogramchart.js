goog.declareModuleId('os.ui.hist.IHistogramChart');

const IDisposable = goog.requireType('goog.disposable.IDisposable');
const {default: IHistogramData} = goog.requireType('os.hist.IHistogramData');


/**
 * Interface for a chart driven by a histogram.
 *
 * @extends {IDisposable}
 * @interface
 */
export default class IHistogramChart {
  /**
   * Clears the chart if one is currently drawn.
   */
  clear() {}

  /**
   * Draws the chart, first clearing any previous one.
   * @param {!Array<!IHistogramData>} data The data to draw.
   * @param {d3.Scale} x The scale for the chart's x axis.
   * @param {d3.Scale} y The scale for the chart's y axis.
   * @param {Object=} opt_options Optional options for the histogram
   */
  draw(data, x, y, opt_options) {}

  /**
   * Applies a tooltip to the chart.
   * @param {d3.Tip} tooltip The d3 tooltip instance.
   */
  tooltip(tooltip) {}
}
