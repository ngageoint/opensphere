goog.provide('os.ui.timeline.CurrentTimeMarker');

goog.require('os.time.TimeInstant');
goog.require('os.ui.timeline.BaseItem');
goog.require('os.ui.timeline.ITimelineItem');



/**
 * @constructor
 * @extends {os.ui.timeline.BaseItem}
 * @implements {os.ui.timeline.ITimelineItem}
 */
os.ui.timeline.CurrentTimeMarker = function() {
  os.ui.timeline.CurrentTimeMarker.base(this, 'constructor');

  /**
   * @type {number?}
   * @private
   */
  this.animationFrameRef_ = null;
};
goog.inherits(os.ui.timeline.CurrentTimeMarker, os.ui.timeline.BaseItem);


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.dispose = function() {
  if (this.animationFrameRef_) {
    window.cancelAnimationFrame(this.animationFrameRef_);
  }
  os.ui.timeline.CurrentTimeMarker.base(this, 'dispose');
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.initSVG = function(container, height) {
  var past = /** @type {d3.Selection} */ (container.append('g'));
  past.append('rect').
      attr('class', 'c-svg-timeline__background-future').
      attr('height', '' + height);
  past.append('text').attr('class', 'label js-c-svg-timeline__current-time').style('text-anchor', 'middle');
  this.animationFrameRef_ = window.requestAnimationFrame(this.updateCurrentTimeRAF.bind(this));
};


/**
 * Compatible RAF call to update the time
 * @param {number} timestamp a DOMHighResTimeStamp indicating the point in time when RAF starts to excute
 */
os.ui.timeline.CurrentTimeMarker.prototype.updateCurrentTimeRAF = function(timestamp) {
  this.updateCurrentTime(true);
};


/**
 * Updates the current time clock and background
 * @param {boolean=} opt_loop loop for request animation frame
 */
os.ui.timeline.CurrentTimeMarker.prototype.updateCurrentTime = function(opt_loop) {
  var times = os.ui.timeline.normalizeExtent(this.xScale.domain());
  var dates = [new Date(times[0]), new Date(times[1])];
  var range = this.xScale.range();
  var today = new Date();
  var prettyDate = new os.time.TimeInstant(today).toISOString().split(' ')[1];
  var shade = d3.select('.c-svg-timeline__background-future');
  var currentDateText = d3.select('.js-c-svg-timeline__current-time');

  if (today > dates[0] && today < dates[1]) { // in view
    var currentDiff = today - dates[0];
    var ratio = currentDiff / (dates[1] - dates[0]);
    var translate = range[1] * ratio;
    shade.style('display', 'block').attr('transform', 'translate(' + translate + ', 0)');
    currentDateText.style('display', 'block').text(prettyDate).attr('transform', 'translate(' + translate + ', 0)');
  } else if (today > dates[0]) { // completely in past
    shade.style('display', 'none');
    currentDateText.style('display', 'none');
  } else { // completely in future
    shade.style('display', 'block').attr('transform', 'translate(0, 0)');
    currentDateText.style('display', 'none');
  }

  if (opt_loop) {
    this.animationFrameRef_ = window.requestAnimationFrame(this.updateCurrentTimeRAF.bind(this));
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.render = function(opt_height) {
  this.updateCurrentTime(false);
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.getExtent = function() {
  return os.ui.timeline.normalizeExtent(this.xScale.domain());
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.getAvg = function() {
  var times = this.getExtent();
  return (times[1] + times[0]) / 2;
};
