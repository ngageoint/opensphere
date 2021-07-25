goog.module('os.ui.hist.LineChart');
goog.module.declareLegacyNamespace();

const Disposable = goog.require('goog.Disposable');
const {maxBinCount} = goog.require('os.hist');
const IHistogramChart = goog.require('os.ui.hist.IHistogramChart'); // eslint-disable-line

const HistogramData = goog.requireType('os.hist.HistogramData');
const TimelineScaleOptions = goog.requireType('os.ui.timeline.TimelineScaleOptions');


/**
 * Draws the histogram as lines.
 *
 * @implements {IHistogramChart}
 */
class LineChart extends Disposable {
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
      parentSelection.selectAll('path, circle, g').remove();
    }
  }

  /**
   * @inheritDoc
   */
  draw(data, x, y) {
    this.clear();

    if (this.parent_ && data.length > 0) {
      var parentSelection = d3.select(this.parent_);
      var xFn = /** @type {d3.ScaleFn} */ (x);
      var yFn = /** @type {d3.ScaleFn} */ (y);
      y.domain([0, maxBinCount(data)]);

      // if the histogram interval is available, try to compute the offset to center x coords for both
      // the path and circles.
      var xOffset = 0;
      var options = /** @type {TimelineScaleOptions} */ (data[0].getOptions());
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
            var hist = /** @type {HistogramData} */ (d);
            return hist.getColor();
          })
          .attr('d', function(d) {
            var histogram = /** @type {HistogramData} */ (d);
            var counts = [];
            for (var key in histogram.getCounts()) {
              counts.push({'key': key, 'value': histogram.getCounts()[key]});
            }

            return lineFn(counts);
          });

      // add circles at positive values
      lines.each(function(d) {
        var histogram = /** @type {HistogramData} */ (d);
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
              var style = 'fill:' + color + ';';
              if (d['value'] == 0) {
                style += 'display:none;';
              }
              return style;
            });
      });
    }
  }

  /**
   * @inheritDoc
   */
  tooltip(tooltip) {
    var parentSelection = d3.select(this.parent_);
    parentSelection.selectAll('circle')
        .on('mouseover', function(data) {
          // the source histogram data reference is stored on the parent group
          var parent = /** @type {Element} */ (this).parentElement;
          var parentData = /** @type {Array<!HistogramData>} */ (d3.select(parent).data());
          if (parentData && parentData.length > 0) {
            tooltip.show(parentData[0], data);
          }
        })
        .on('mouseout', tooltip.hide);
  }
}

exports = LineChart;
