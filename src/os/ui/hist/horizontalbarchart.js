goog.provide('os.ui.hist.BarChartOptions');
goog.provide('os.ui.hist.HorizontalBarChart');
goog.require('goog.Disposable');
goog.require('os.hist');
goog.require('os.ui.hist.IHistogramChart');


/**
 * @typedef {{
 *   ticks: Object,
 *   tickMap: Array,
 *   useBorders: boolean,
 *   showTotal
 * }}
 */
os.ui.hist.BarChartOptions;



/**
 * Draws the histogram as horizontal bars.
 * @param {!Element} parent The parent SVG container for the chart.
 * @implements {os.ui.hist.IHistogramChart}
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.hist.HorizontalBarChart = function(parent) {
  /**
   * @type {?Element}
   * @private
   */
  this.parent_ = parent;
};
goog.inherits(os.ui.hist.HorizontalBarChart, goog.Disposable);


/**
 * @type {number}
 * @const
 * @private
 */
os.ui.hist.HorizontalBarChart.DEFAULT_HEIGHT_ = 19;


/**
 * @inheritDoc
 */
os.ui.hist.HorizontalBarChart.prototype.disposeInternal = function() {
  this.clear();
  this.parent_ = null;

  os.ui.hist.HorizontalBarChart.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.ui.hist.HorizontalBarChart.prototype.clear = function() {
  if (this.parent_) {
    var parentSelection = d3.select(this.parent_);
    parentSelection.selectAll('.bar').remove();
    parentSelection.selectAll('g').remove();
  }
};


/**
 * @inheritDoc
 */
os.ui.hist.HorizontalBarChart.prototype.draw = function(data, x, y, opt_options) {
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
    var max = os.hist.getBinCounts(data, true)[0];
    var maxValue = goog.object.getValues(max)[0];

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

      var barHeight = os.ui.hist.HorizontalBarChart.DEFAULT_HEIGHT_;

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
};


/**
 * @inheritDoc
 */
os.ui.hist.HorizontalBarChart.prototype.tooltip = function(tooltip) {
  var parentSelection = d3.select(this.parent_);
  parentSelection.selectAll('rect')
      .on('mouseover', function(data) {
        // the source histogram data reference is stored on the parent group
        var parent = /** @type {Element} */ (this).parentElement;
        var parentData = /** @type {Array.<!os.hist.HistogramData>} */ (d3.select(parent).data());
        if (parentData && parentData.length > 0) {
          tooltip.show(parentData[0], data);
        }
      })
      .on('mouseout', tooltip.hide)
      .on('click', tooltip.hide);
};


/**
 * Draws total numbers on the end of each bar.
 * @param {d3.ScaleFn} xFn The xFn for calculating the x position of the totals.
 * @param {d3.ScaleFn} yFn The yFn for calculating the y postitions of each count.
 * @param {Array.<Object>} ticks The ticks and their totals to draw.
 * @private
 */
os.ui.hist.HorizontalBarChart.prototype.drawTotals_ = function(xFn, yFn, ticks) {
  var parentSelection = d3.select(this.parent_);
  var g = parentSelection.append('g');

  goog.array.forEach(ticks, function(tick, idx) {
    var text = goog.object.getValues(ticks[idx])[0];
    var x = xFn(text) + (text + '').length * 6;
    var y = yFn(idx + 1) - os.ui.hist.HorizontalBarChart.DEFAULT_HEIGHT_ / 4;
    g.append('text')
        .attr('class', 'hist-text')
        .attr('x', x)
        .attr('y', y)
        .text(text);
  }, this);
};
