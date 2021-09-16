goog.module('os.ui.timeline.TileAxis');

const time = goog.require('os.time');
const TimelineController = goog.require('os.time.TimelineController');
const timeline = goog.require('os.ui.timeline');
const BaseItem = goog.require('os.ui.timeline.BaseItem');

const ITimelineItem = goog.requireType('os.ui.timeline.ITimelineItem');


/**
 * @implements {ITimelineItem}
 */
class TileAxis extends BaseItem {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {d3.Axis}
     * @private
     */
    this.axis_ = d3.svg.axis();
    this.setInteractive(false);
  }

  /**
   * @return {Array<Date>}
   * @protected
   */
  getTicks() {
    var times = timeline.normalizeExtent(this.xScale.domain());
    var dates = [new Date(times[0]), new Date(times[1])];

    var xFn = /** @type {d3.ScaleFn} */ (this.xScale);
    var pixelScale = 1 / (xFn(1) - xFn(0));
    var px20time = Number(pixelScale.toPrecision(2)) * 20;

    var tlc = TimelineController.getInstance();
    var duration = tlc.getDuration();

    var begin = time.floor(dates[0], duration);
    var last = null;
    var ticks = [];

    for (var i = 0; last === null || last <= dates[1]; i++) {
      var d = time.offset(begin, duration, i);

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
  }

  /**
   * @inheritDoc
   */
  initSVG(container, height) {
    if (this.xScale) {
      this.axis_.orient('top').
          scale(this.xScale).
          tickSize(-height, -height).
          tickFormat(d3.format('')).
          tickValues(this.getTicks());
    }

    var group = /** @type {d3.Selection} */ (container.append('g'));
    group.attr('class', 'axis c-svg-timeline__tile-axis').call(this.axis_);
  }

  /**
   * @inheritDoc
   */
  render(opt_height) {
    if (opt_height !== undefined) {
      this.axis_.tickSize(-opt_height, -opt_height);
    }

    this.axis_.tickValues(this.getTicks());

    var group = d3.select('.c-svg-timeline__tile-axis');
    group.call(/** @type {Function} */ (this.axis_));
  }

  /**
   * @inheritDoc
   */
  getExtent() {
    return timeline.normalizeExtent(this.xScale.domain());
  }

  /**
   * @inheritDoc
   */
  getAvg() {
    var times = this.getExtent();
    return (times[1] + times[0]) / 2;
  }
}

exports = TileAxis;
