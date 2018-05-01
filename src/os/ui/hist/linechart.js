goog.provide('os.ui.hist.LineChart');
goog.require('goog.Disposable');
goog.require('os.color');
goog.require('os.hist');
goog.require('os.ui.hist.IHistogramChart');



/**
 * Draws the histogram as lines.
 * @param {!Element} parent The parent SVG container for the chart.
 * @implements {os.ui.hist.IHistogramChart}
 * @extends {goog.Disposable}
 * @constructor
 */
os.ui.hist.LineChart = function(parent) {
  /**
   * @type {?Element}
   * @private
   */
  this.parent_ = parent;
};
goog.inherits(os.ui.hist.LineChart, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.hist.LineChart.prototype.disposeInternal = function() {
  this.clear();
  this.parent_ = null;

  os.ui.hist.LineChart.superClass_.disposeInternal.call(this);
};


/**
 * @inheritDoc
 */
os.ui.hist.LineChart.prototype.clear = function() {
  if (this.parent_) {
    var parentSelection = d3.select(this.parent_);
    parentSelection.selectAll('path, circle, g').remove();
  }
};


/**
 * @inheritDoc
 */
os.ui.hist.LineChart.prototype.draw = function(data, x, y) {
  this.clear();

  if (this.parent_ && data.length > 0) {
    var parentSelection = d3.select(this.parent_);
    var xFn = /** @type {d3.ScaleFn} */ (x);
    var yFn = /** @type {d3.ScaleFn} */ (y);
    y.domain([0, os.hist.maxBinCount(data)]);

    // if the histogram interval is available, try to compute the offset to center x coords for both
    // the path and circles.
    var xOffset = 0;
    var options = /** @type {os.ui.timeline.TimelineScaleOptions} */ (data[0].getOptions());
    if (options && options.interval > 0) {
      xOffset = Math.round((xFn(options.interval) - xFn(0)) / 2);
    }

    var line = d3.svg.line().interpolate('linear')
        .x(function(d) {
          return xFn(d['key']) + xOffset;
        })
        .y(function(d) {
          return yFn(d['value']);
        });
    var lineFn = /** @type {d3.LineFn} */ (line);

    var lines = parentSelection.selectAll('g').data(data)
        .enter().append('g').attr('class', 'c-histogram-line');
    lines.append('path')
        .attr('stroke', function(d) {
          var hist = /** @type {os.hist.HistogramData} */ (d);
          return hist.getColor();
        })
        .attr('d', function(d) {
          var histogram = /** @type {os.hist.HistogramData} */ (d);
          var counts = [];
          for (var key in histogram.getCounts()) {
            counts.push({'key': key, 'value': histogram.getCounts()[key]});
          }

          return lineFn(counts);
        });

    // add circles at positive values
    lines.each(function(d) {
      var histogram = /** @type {os.hist.HistogramData} */ (d);
      var counts = [];
      for (var key in histogram.getCounts()) {
        var value = histogram.getCounts()[key];
        if (value > 0) {
          counts.push({'key': key, 'value': value});
        }
      }

      d3.select(/** @type {Element} */ (this)).selectAll('circle').data(counts).enter().append('circle')
          .attr('class', 'c-histogram-group__line-point')
          .attr('cx', function(d) {
            return xFn(d['key']) + xOffset;
          })
          .attr('cy', function(d) {
            return yFn(d['value']);
          })
          .attr('r', 3)
          .attr('style', function(d) {
            var color = histogram.getColor();
            var lightColor = os.color.lighten(color, 0.8);
            var style = 'stroke:' + color + ';fill:' + lightColor + ';';
            if (d['value'] == 0) {
              style += 'display:none;';
            }
            return style;
          });
    });
  }
};


/**
 * @inheritDoc
 */
os.ui.hist.LineChart.prototype.tooltip = function(tooltip) {
  var parentSelection = d3.select(this.parent_);
  parentSelection.selectAll('circle')
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
