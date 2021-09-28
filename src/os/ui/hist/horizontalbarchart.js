goog.declareModuleId('os.ui.hist.HorizontalBarChart');

import {getBinCounts} from '../../hist/hist.js';
import IHistogramChart from './ihistogramchart.js';// eslint-disable-line

const Disposable = goog.require('goog.Disposable');

const {default: HistogramData} = goog.requireType('os.hist.HistogramData');


/**
 * Draws the histogram as horizontal bars.
 *
 * @implements {IHistogramChart}
 */
export default class HorizontalBarChart extends Disposable {
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
      var yTicks;
      var tickMap;
      var useBorders;
      var showTotal;
      if (opt_options) {
        yTicks = opt_options.ticks;
        tickMap = opt_options.tickMap;
        useBorders = opt_options.useBorders;
        showTotal = opt_options.showTotal;
      }

      var parentSelection = d3.select(this.parent_);
      var xFn = /** @type {d3.ScaleFn} */ (x);
      var yFn = /** @type {d3.ScaleFn} */ (y);
      var max = getBinCounts(data, true)[0];
      var maxValue = Object.values(max)[0];

      if (showTotal) {
        var maxWidth = x.range()[1] - ((maxValue.length + '').length * 10 + 1);
        x.range([x.range()[0], maxWidth]);
      }
      x.domain([0, maxValue]);

      var binWidths = {};
      for (var i = 0, n = data.length; i < n; i++) {
        var histogram = data[i];
        var counts = [];
        for (var key in histogram.getCounts()) {
          var value = histogram.getCounts()[key];
          if (value > 0 || value.length > 0) {
            counts.push({'key': key, 'value': value});
          }
        }

        var barHeight = HorizontalBarChart.DEFAULT_HEIGHT_;

        // create a bar for each histogram count
        var g = parentSelection.append('g');
        g.data([histogram]);
        g.selectAll('.bar').data(counts)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('y', function(d, i) {
              if (tickMap) {
                return yFn(tickMap.indexOf(d['key']));
              } else {
                return yFn(d['value']);
              }
            })
            .attr('x', function(d) {
              var value = xFn(0);
              var bin = d['key'];
              if (bin in binWidths) {
                value = binWidths[bin] - xFn(0);
              }

              binWidths[bin] = value + Math.max(xFn(d['value'].length), xFn(0) + 1);
              return value;
            })
            .attr('width', function(d) {
              return Math.max(xFn(d['value'].length) - xFn(0), 1);
            })
            .attr('style', function(d) {
              var w = d3.select(this).attr('width');
              var width = 2 * w + barHeight;
              var s = 'fill: ' + histogram.getColor() + ';';
              if (useBorders && w > 1.5) {
                s += ' stroke: #fff;';
                s += ' stroke-dasharray: ' + '0 ' + width + ' 0;';
              }
              return s;
            })
            .attr('height', barHeight);
      }

      if (showTotal) {
        this.drawTotals_(xFn, yFn, yTicks);
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
          var parentData = /** @type {Array<!HistogramData>} */ (d3.select(parent).data());
          if (parentData && parentData.length > 0) {
            tooltip.show(parentData[0], data);
          }
        })
        .on('mouseout', tooltip.hide)
        .on('click', tooltip.hide);
  }

  /**
   * Draws total numbers on the end of each bar.
   *
   * @param {d3.ScaleFn} xFn The xFn for calculating the x position of the totals.
   * @param {d3.ScaleFn} yFn The yFn for calculating the y postitions of each count.
   * @param {Array<Object>} ticks The ticks and their totals to draw.
   * @private
   */
  drawTotals_(xFn, yFn, ticks) {
    var parentSelection = d3.select(this.parent_);
    var g = parentSelection.append('g');

    ticks.forEach(function(tick, idx) {
      var text = Object.values(ticks[idx])[0];
      var x = xFn(text) + (text + '').length * 6;
      var y = yFn(idx + 1) - HorizontalBarChart.DEFAULT_HEIGHT_ / 4;
      g.append('text')
          .attr('class', 'hist-text')
          .attr('x', x)
          .attr('y', y)
          .text(text);
    }, this);
  }
}


/**
 * @type {number}
 * @const
 * @private
 */
HorizontalBarChart.DEFAULT_HEIGHT_ = 19;
