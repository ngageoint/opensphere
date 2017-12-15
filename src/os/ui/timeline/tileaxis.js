goog.provide('os.ui.timeline.TileAxis');
goog.require('os.ui.timeline.BaseItem');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * @constructor
 * @extends {os.ui.timeline.BaseItem}
 * @implements {os.ui.timeline.ITimelineItem}
 */
os.ui.timeline.TileAxis = function() {
  os.ui.timeline.TileAxis.base(this, 'constructor');

  /**
   * @type {d3.Axis}
   * @private
   */
  this.axis_ = d3.svg.axis();
  this.setInteractive(false);
};
goog.inherits(os.ui.timeline.TileAxis, os.ui.timeline.BaseItem);


/**
 * @return {Array<Date>}
 * @protected
 */
os.ui.timeline.TileAxis.prototype.getTicks = function() {
  var times = os.ui.timeline.normalizeExtent(this.xScale.domain());
  var dates = [new Date(times[0]), new Date(times[1])];

  var xFn = /** @type {d3.ScaleFn} */ (this.xScale);
  var pixelScale = 1 / (xFn(1) - xFn(0));
  var px20time = Number(pixelScale.toPrecision(2)) * 20;

  var tlc = os.time.TimelineController.getInstance();
  var duration = tlc.getDuration();

  var begin = os.time.floor(dates[0], duration);
  var last = null;
  var ticks = [];

  for (var i = 0; last === null || last <= dates[1]; i++) {
    var d = os.time.offset(begin, duration, i);

    // stop showing ticks if they get closer than 20px
    if (last !== null && d.getTime() - last < px20time) {
      break;
    }

    last = d.getTime();

    if (last >= dates[0]) {
      ticks.push(d);
    }
  }

  return ticks;
};


/**
 * @inheritDoc
 */
os.ui.timeline.TileAxis.prototype.initSVG = function(container, height) {
  if (this.xScale) {
    this.axis_.orient('top').
        scale(this.xScale).
        tickSize(-height, -height).
        tickFormat(d3.format('')).
        tickValues(this.getTicks());
  }

  var group = /** @type {d3.Selection} */ (container.append('g'));
  group.attr('class', 'axis tile-axis').call(this.axis_);
};


/**
 * @inheritDoc
 */
os.ui.timeline.TileAxis.prototype.render = function(opt_height) {
  if (goog.isDef(opt_height)) {
    this.axis_.tickSize(-opt_height, -opt_height);
  }

  this.axis_.tickValues(this.getTicks());

  var group = d3.select('.tile-axis');
  group.call(/** @type {Function} */ (this.axis_));
};


/**
 * @inheritDoc
 */
os.ui.timeline.TileAxis.prototype.getExtent = function() {
  return os.ui.timeline.normalizeExtent(this.xScale.domain());
};


/**
 * @inheritDoc
 */
os.ui.timeline.TileAxis.prototype.getAvg = function() {
  var times = this.getExtent();
  return (times[1] + times[0]) / 2;
};
