goog.provide('os.ui.timeline.CurrentTimeMarker');

goog.require('goog.async.Delay');
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
   * The main background of the timeline
   * @type {?d3.Selection}
   * @private
   */
  this.backgroundElement_ = null;

  /**
   * Delay to handle periodic updates to the marker.
   * @type {goog.async.Delay}
   * @private
   */
  this.updateDelay_ = new goog.async.Delay(this.updateCurrentTime_, 1000, this);
};
goog.inherits(os.ui.timeline.CurrentTimeMarker, os.ui.timeline.BaseItem);


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.disposeInternal = function() {
  os.ui.timeline.CurrentTimeMarker.base(this, 'disposeInternal');

  goog.dispose(this.updateDelay_);
  this.updateDelay_ = null;
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.initSVG = function(container, height) {
  var background = /** @type {d3.Selection} */ (d3.select('.js-svg-timeline__background-group'));
  this.backgroundElement_ = background.append('rect').attr('height', '100%').attr('width', '100%').
      attr('class', 'c-svg-timeline__background-future js-svg-timeline__background-future').
      on(goog.events.EventType.MOUSEDOWN, this.styleDragStart_.bind(this)).
      on(goog.events.EventType.MOUSEUP, this.styleDragEnd_.bind(this)).
      on(goog.events.EventType.MOUSEOUT, this.styleDragEnd_.bind(this));
  var currentTime = /** @type {d3.Selection} */ (container.append('g')).style('cursor', 'pointer');
  currentTime.attr('id', 'js-svg-timeline__time-background').append('title').text('Click to hide/show current time');
  currentTime.append('rect').attr('class', 'js-svg-timeline__bg-time').attr('height', '16');
  currentTime.append('text').attr('class', 'label c-svg-timeline__current-time js-svg-timeline__current-time');

  this.updateCurrentTime_();
};


/**
 * Updates the current time clock and background.
 *
 * @private
 */
os.ui.timeline.CurrentTimeMarker.prototype.updateCurrentTime_ = function() {
  if (this.isDisposed()) {
    return;
  }

  var visible = true;
  var times = this.getExtent();
  var dates = [new Date(times[0]), new Date(times[1])];
  var range = this.xScale.range();
  var today = new Date();
  var date = new os.time.TimeInstant(today).toISOString().split(' ');
  var prettyDate = date.length === 2 ? date[1] : date.length === 3 ? date[1] + ' ' + date[2] : ''; // include offset
  var timeBackground = d3.select('.js-svg-timeline__bg-time');
  var currentDateText = d3.select('.js-svg-timeline__current-time');
  var placeholder = d3.select('#js-svg-timeline__background-time-placeholder');

  if (today > dates[0] && today < dates[1]) { // in view
    var currentDiff = today - dates[0];
    var ratio = currentDiff / (dates[1] - dates[0]);
    var translate = range[1] * ratio;
    this.backgroundElement_.style('display', 'block').attr('transform', 'translate(' + translate + ', 0)');
    placeholder.style('display', 'block');

    var transformString = 'translate(' + (translate + prettyDate.length - 5) + ', -4)';
    currentDateText.style('display', 'block').text(prettyDate).attr('transform', transformString);

    // fit background to text
    var currentDateTextEl = currentDateText[0][0];
    if (currentDateTextEl) {
      var textRect = currentDateTextEl.getBBox();
      timeBackground.style('display', 'block').attr('transform', transformString).
          attr('x', textRect.x).attr('y', textRect.y).attr('width', textRect.width);
    }
  } else if (today > dates[0]) { // completely in past
    this.backgroundElement_.style('display', 'none');
    currentDateText.style('display', 'none');
    timeBackground.style('display', 'none');
    placeholder.style('display', 'none');
    visible = false;
  } else { // completely in future
    this.backgroundElement_.style('display', 'block').attr('transform', 'translate(0, 0)');
    currentDateText.style('display', 'none');
    timeBackground.style('display', 'none');
    placeholder.style('display', 'none');
    visible = false;
  }

  if (visible && this.updateDelay_) {
    // update as close to the next second as possible
    this.updateDelay_.start(1000 - Date.now() % 1000);
  }
};


/**
 * Append dragging classes to the timeline background element
 *
 * @private
 */
os.ui.timeline.CurrentTimeMarker.prototype.styleDragStart_ = function() {
  this.backgroundElement_.classed('dragging', true);
};


/**
 * Remove dragging classes from the timeline background element
 *
 * @private
 */
os.ui.timeline.CurrentTimeMarker.prototype.styleDragEnd_ = function() {
  if (this.backgroundElement_) {
    this.backgroundElement_.classed('dragging', false);
  }
};


/**
 * @inheritDoc
 */
os.ui.timeline.CurrentTimeMarker.prototype.render = function(opt_height) {
  this.updateCurrentTime_();
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
