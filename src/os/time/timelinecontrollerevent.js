goog.provide('os.time.TimelineActionEventType');
goog.provide('os.time.TimelineControllerEvent');
goog.provide('os.time.TimelineEventType');
goog.require('goog.events.Event');
goog.require('os.time.TimeRange');


/**
 * @enum {string}
 */
os.time.TimelineEventType = {
  DURATION_CHANGE: 'timeline.durationChange',
  FPS_CHANGE: 'timeline.fpsChange',
  LOOPING_TOGGLE: 'timeline.loopingToggle',
  FADE_TOGGLE: 'timeline.fadeToggle',
  PLAY: 'timeline.play',
  STOP: 'timeline.stop',
  RESET: 'timeline.reset',
  SHOW: 'timeline.show',
  DRAG: 'timeline.drag',
  RECORD: 'timeline.record',
  CAPTURE: 'timeline.capture',
  RANGE_CHANGED: 'timleline.rangeChanged',
  SLICE_RANGE_CHANGED: 'timeline.slice.rangeChanged',
  ANIMATE_RANGE_CHANGED: 'timeline.animate.rangeChanged',
  HOLD_RANGE_CHANGED: 'timeline.animate.holdRangeChanged',
  REFRESH_LOAD: 'timeline.refreshLoad'
};


/**
 * timeline actions
 * @enum {string}
 */
os.time.TimelineActionEventType = {
  LOAD: 'timeline.load',
  ADD: 'timeline.add',
  SLICE: 'timeline.slice',
  SELECT: 'timeline.select',
  SELECT_EXCLUSIVE: 'timeline.selectExclusive',
  DESELECT: 'timeline.deselect',
  REMOVE: 'timeline.remove',
  ANIMATE: 'timeline.animate',
  ANIMATE_SKIP: 'timeline.animateSkip',
  ANIMATE_HOLD: 'timeline.animateHold',
  ACTIVE_WINDOW: 'timeline.activeWindow',
  ZOOM: 'timeline.zoom'
};



/**
 * Event for os.time.TimelineController.
 * @param {string} type
 * @extends {goog.events.Event}
 * @constructor
 */
os.time.TimelineControllerEvent = function(type) {
  os.time.TimelineControllerEvent.base(this, 'constructor', type);

  /**
   * @type {?os.time.TimeRange}
   * @private
   */
  this.range_ = null;

  /**
   * @type {number}
   * @private
   */
  this.current_ = 0;

  /**
   * @type {number}
   * @private
   */
  this.window_ = 0;
};
goog.inherits(os.time.TimelineControllerEvent, goog.events.Event);


/**
 * @param {number} current
 * @param {boolean} fade
 * @param {number} window
 */
os.time.TimelineControllerEvent.prototype.setData = function(current, fade, window) {
  this.current_ = current;
  this.fade_ = fade;
  this.window_ = window;
  this.range_ = new os.time.TimeRange(window, current);
};


/**
 * @return {?os.time.TimeRange}
 */
os.time.TimelineControllerEvent.prototype.getRange = function() {
  return this.range_;
};


/**
 * @return {number}
 */
os.time.TimelineControllerEvent.prototype.getCurrent = function() {
  return this.current_;
};


/**
 * @return {number}
 */
os.time.TimelineControllerEvent.prototype.getWindow = function() {
  return this.window_;
};


/**
 * @return {string} String representing the time range, if present.
 * @override
 */
os.time.TimelineControllerEvent.prototype.toString = function() {
  if (this.range_) {
    return this.range_.toISOString();
  }

  return os.time.TimelineControllerEvent.superClass_.toString.call(this);
};
