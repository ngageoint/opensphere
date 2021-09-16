goog.module('os.ui.hist.StackedBarChart');

const Disposable = goog.require('goog.Disposable');
const {maxBinCount} = goog.require('os.hist');
const IHistogramChart = goog.require('os.ui.hist.IHistogramChart'); // eslint-disable-line

const HistogramData = goog.requireType('os.hist.HistogramData');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Draws the histogram as stacked bars.
 *
 * @implements {IHistogramChart}
 */
class StackedBarChart extends Disposable {
  /**
   * Constructor.
   * @param {!Element} parent The parent SVG container for the chart.
   */
  constructor(parent) {
    super();

    /**
     * @type {?Element}
     * @private
     */
    this.parent_ = parent;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.clear();
    this.parent_ = null;

    super.disposeInternal();
  }

  /**
   * @inheritDoc
   */
  clear() {
    if (this.parent_) {
      var parentSelection = d3.select(this.parent_);
      parentSelection.selectAll('.bar').remove();
      parentSelection.selectAll('g').remove();
    }
  }

  /**
   * @inheritDoc
   */
  draw(data, x, y, opt_options) {
    this.clear();

    if (this.parent_ && data.length > 0) {
      var parentSelection = d3.select(this.parent_);
      var xFn = /** @type {d3.ScaleFn} */ (x);
      var yFn = /** @type {d3.ScaleFn} */ (y);
      y.domain([0, maxBinCount(data, true)]);

      var binHeights = {};
      for (var i = 0, n = data.length; i < n; i++) {
        var histogram = data[i];
        var counts = [];
        for (var key in histogram.getCounts()) {
          var value = histogram.getCounts()[key];
          if (value > 0) {
            counts.push({'key': key, 'value': value});
          }
        }

        // calculate the bar width if possible using the histogram interval
        var barWidth = defaultWidth;
        var options = /** @type {TimelineScaleOptions} */ (histogram.getOptions());
        if (options && options.interval > 0) {
          barWidth = xFn(options.interval) - xFn(0);
        }

        // create a bar for each histogram count
        var g = parentSelection.append('g');
        g.data([histogram]);
        g.selectAll('.bar').data(counts)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function(d) {
              return xFn(d['key']);
            })
            .attr('y', function(d) {
              var value = yFn(d['value']);
              var start = d['key'];
              if (start in binHeights) {
                // y = previous height - bar height
                value = binHeights[start] - (yFn(0) - yFn(d['value']));
              }

              binHeights[start] = value;
              return value;
            })
            .attr('height', function(d) {
              return yFn(0) - yFn(d['value']);
            })
            .attr('style', function(d) {
              return 'fill: ' + histogram.getColor();
            })
            .attr('width', barWidth);
      }
    }
  }

  /**
   * @inheritDoc
   */
  tooltip(tooltip) {
    var parentSelection = d3.select(this.parent_);
    parentSelection.selectAll('rect')
        .on('mouseover', function(data) {
          // the source histogram data reference is stored on the parent group
          var parent = /** @type {Element} */ (this).parentElement;
          var parentData = /** @type {Array.<!HistogramData>} */ (d3.select(parent).data());
          if (parentData && parentData.length > 0) {
            tooltip.show(parentData[0], data);
          }
        })
        .on('mouseout', tooltip.hide);
  }
}

/**
 * @type {number}
 */
const defaultWidth = 10;

exports = StackedBarChart;
