goog.provide('os.ui.hist.StackedBarChart');
goog.require('goog.Disposable');
goog.require('os.hist');
goog.require('os.ui.hist.IHistogramChart');



/**
 * Draws the histogram as stacked bars.
 * @param {!Element} parent The parent SVG container for the chart.
 * @implements {os.ui.hist.IHistogramChart}
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.hist.StackedBarChart = function(parent) {
  /**
   * @type {?Element}
   * @private
   */
  this.parent_ = parent;
};
goog.inherits(os.ui.hist.StackedBarChart, goog.Disposable);


/**
 * @type {number}
 * @const
 * @private
 */
os.ui.hist.StackedBarChart.DEFAULT_WIDTH_ = 10;


/**
 * @inheritDoc
 */
os.ui.hist.StackedBarChart.prototype.disposeInternal = function() {
  this.clear();
  this.parent_ = null;

  os.ui.hist.StackedBarChart.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.ui.hist.StackedBarChart.prototype.clear = function() {
  if (this.parent_) {
    var parentSelection = d3.select(this.parent_);
    parentSelection.selectAll('.bar').remove();
    parentSelection.selectAll('g').remove();
  }
};


/**
 * @inheritDoc
 */
os.ui.hist.StackedBarChart.prototype.draw = function(data, x, y, opt_options) {
  this.clear();

  if (this.parent_ && data.length > 0) {
    var parentSelection = d3.select(this.parent_);
    var xFn = /** @type {d3.ScaleFn} */ (x);
    var yFn = /** @type {d3.ScaleFn} */ (y);
    y.domain([0, os.hist.maxBinCount(data, true)]);

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
      var barWidth = os.ui.hist.StackedBarChart.DEFAULT_WIDTH_;
      var options = /** @type {os.ui.timeline.TimelineScaleOptions} */ (histogram.getOptions());
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
};


/**
 * @inheritDoc
 */
os.ui.hist.StackedBarChart.prototype.tooltip = function(tooltip) {
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
      .on('mouseout', tooltip.hide);
};
