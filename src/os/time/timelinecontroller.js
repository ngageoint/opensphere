goog.provide('os.time.TimelineController');

goog.require('goog.Timer');
goog.require('goog.async.Delay');
goog.require('goog.events.EventTarget');
goog.require('goog.math.Range');
goog.require('goog.math.RangeSet');
goog.require('os.IPersistable');
goog.require('os.config.Settings');
goog.require('os.time.Duration');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineControllerEvent');
goog.require('os.time.TimelineEventType');
goog.require('os.time.timeline');



/**
 * Controls time state within os.js.
 * @extends {goog.events.EventTarget}
 * @implements {os.IPersistable}
 * @constructor
 * @todo If this is extended (ie, MyTimelineController), the application should add the getInstance function instead
 *    of using goog.addSingletonGetter. If you have a better idea on how to do that, go for it, but that was my
 *    initial thought.
 */
os.time.TimelineController = function() {
  os.time.TimelineController.base(this, 'constructor');

  /**
   * The frames per second for the animation.
   * @type {number}
   * @private
   */
  this.fps_ = /** @type {number} */ (os.settings.get(['tlc', 'fps'], 2));

  /**
   * The start date of the animation timeline.
   * @type {number}
   * @private
   */
  this.current_ = 0;

  /**
   * @type {string}
   * @private
   */
  this.duration_ = os.time.Duration.DAY;

  /**
   * @type {boolean}
   * @private
   */
  this.fade_ = false;

  /**
   * @type {number}
   * @private
   */
  this.offset_ = 1000;

  /**
   * @type {number}
   * @private
   */
  this.skip_ = 1000;

  /**
   * @type {boolean}
   * @private
   */
  this.includeEnd_ = true;

  /**
   * @type {number}
   * @private
   */
  this.lastCurrent_ = Number.MAX_VALUE;

  /**
   * If events should be fired on timer tick.
   * @type {boolean}
   * @private
   */
  this.suppressShowEvents_ = false;

  /**
   * @type {os.time.TimelineControllerEvent}
   * @private
   */
  this.lastEvent_ = null;

  /**
   * Timer to fire off events.
   * @type {goog.Timer}
   * @private
   */
  this.animationTimer_ = new goog.Timer(1000 / this.fps_);
  this.animationTimer_.listen(goog.Timer.TICK, this.onAnimationTimer_, false, this);

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.resetTimer_ = new goog.async.Delay(this.onResetTimer_, 50, this);

  /**
   * @type {goog.math.RangeSet}
   * @private
   */
  this.loadRanges_ = new goog.math.RangeSet();
  this.addLoadRange(new goog.math.Range(0, 0));


  /**
   * @type {goog.math.RangeSet}
   * @private
   */
  this.calcRangeCache_ = new goog.math.RangeSet();

  /**
   * @type {goog.math.RangeSet}
   * @private
   */
  this.sliceRanges_ = new goog.math.RangeSet();

  /**
   * @type {goog.math.RangeSet}
   * @private
   */
  this.animateRanges_ = new goog.math.RangeSet();

  /**
   * @type {goog.math.RangeSet}
   * @private
   */
  this.holdRanges_ = new goog.math.RangeSet();

  /**
   * The minimum range allowed to be added
   * to the time line controller.
   * @type {number}
   */
  this.minRange = 1000;

  /**
   * @type {?goog.math.Range}
   * @private
   */
  this.lastRange_ = null;

  /**
   * @type {boolean}
   * @private
   */
  this.hasNextFlag_ = false;

  this.initialize_();
};
goog.inherits(os.time.TimelineController, goog.events.EventTarget);
goog.addSingletonGetter(os.time.TimelineController);


/**
 * Initialize the timeline controller.
 * @private
 * @todo This is temporary until we have user options to set the default time on startup.
 */
os.time.TimelineController.prototype.initialize_ = function() {
  var duration = os.time.Duration.DAY;
  var start = os.time.toUTCDate(new Date());
  start = os.time.floor(start, duration);
  var end = os.time.offset(start, duration, 1);

  this.setIncludeEnd(true);
  this.setSuppressShowEvents(true);
  this.setRange(this.buildRange(start.getTime(), end.getTime()));
  this.setDuration(duration);
  this.setOffset(this.getSmallestAnimateRangeLength());
  this.setFade(false);
  this.setCurrent(end.getTime());
  this.setSuppressShowEvents(false);
  this.updateOffetsAndCurrent_();
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.isPlaying = function() {
  return goog.isDefAndNotNull(this.animationTimer_) && this.animationTimer_.enabled;
};


/**
 * Getter for current time.
 * @return {number}
 */
os.time.TimelineController.prototype.getCurrent = function() {
  return this.current_;
};


/**
 * Setter for current time.
 * @param {number} value
 */
os.time.TimelineController.prototype.setCurrent = function(value) {
  if (this.current_ !== value) {
    this.lastCurrent_ = this.current_;
    this.current_ = value;
    this.dispatchShowEvent_();
  }
};


/**
 * Gets the current range of the controller.
 * @return {os.time.TimeRange}
 */
os.time.TimelineController.prototype.getCurrentTimeRange = function() {
  return new os.time.TimeRange(new Date(this.current_ - this.offset_), new Date(this.current_));
};


/**
 * Gets the current range of the controller.
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getCurrentRange = function() {
  return new goog.math.Range(this.current_ - this.offset_, this.current_);
};


/**
 * @return {string}
 */
os.time.TimelineController.prototype.getDuration = function() {
  return this.duration_;
};


/**
 * @param {string} value
 */
os.time.TimelineController.prototype.setDuration = function(value) {
  if (this.duration_ != value) {
    this.duration_ = value;
    this.clearAnimateRanges();
    this.clearHoldRanges();
    this.dispatchEvent(os.time.TimelineEventType.DURATION_CHANGE);
  }
};


/**
 * Get the end value of the timeline range.
 * @return {number} The end value
 */
os.time.TimelineController.prototype.getEnd = function() {
  return this.getLoadRange().end;
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.getFade = function() {
  return this.fade_;
};


/**
 * @param {boolean} value
 */
os.time.TimelineController.prototype.setFade = function(value) {
  this.fade_ = value;
  this.dispatchEvent(os.time.TimelineEventType.FADE_TOGGLE);
};


/**
 * Getter for framerate.
 * @return {number}
 */
os.time.TimelineController.prototype.getFps = function() {
  return this.fps_;
};


/**
 * Setter for framerate.
 * @param {number} fps
 */
os.time.TimelineController.prototype.setFps = function(fps) {
  var wasPlaying = this.isPlaying();
  if (this.animationTimer_) {
    this.animationTimer_.dispose();
  }

  this.fps_ = fps;
  this.animationTimer_ = new goog.Timer(1000 / this.fps_);
  this.animationTimer_.listen(goog.Timer.TICK, this.onAnimationTimer_, false, this);

  if (wasPlaying) {
    this.animationTimer_.start();
  }

  os.settings.set(['tlc', 'fps'], fps);
  this.dispatchEvent(os.time.TimelineEventType.FPS_CHANGE);
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.getIncludeEnd = function() {
  return this.includeEnd_;
};


/**
 * @param {boolean} value
 */
os.time.TimelineController.prototype.setIncludeEnd = function(value) {
  this.includeEnd_ = value;
};


/**
 * @return {?os.time.TimelineControllerEvent}
 */
os.time.TimelineController.prototype.getLastEvent = function() {
  return this.lastEvent_;
};


/**
 * @return {number}
 */
os.time.TimelineController.prototype.getLoopStart = function() {
  return this.getAnimationRange().start;
};


/**
 * @return {number}
 */
os.time.TimelineController.prototype.getLoopEnd = function() {
  return this.getAnimationRange().end;
};


/**
 * @return {number}
 */
os.time.TimelineController.prototype.getSmallestAnimateRangeLength = function() {
  var rangeSet = this.animateRanges_.isEmpty() ? this.getEffectiveLoadRangeSet() : this.animateRanges_;
  var values = [];
  goog.iter.forEach(rangeSet.__iterator__(false), function(value) {
    values.push(value.getLength());
  });
  goog.array.sort(values);
  return values[0];
};


/**
 * @return {number}
 */
os.time.TimelineController.prototype.getOffset = function() {
  return this.offset_;
};


/**
 * @param {number} value
 */
os.time.TimelineController.prototype.setOffset = function(value) {
  var old = this.offset_;
  this.offset_ = Math.max(value, 0);

  if (old != this.offset_) {
    this.dispatchShowEvent_();
  }
};


/**
 * Sets the current range using a start value and the duration.
 * @param {number} value
 */
os.time.TimelineController.prototype.setRangeStart = function(value) {
  var startTime = os.time.floor(new Date(value), this.getDuration()).getTime();
  var endTime = os.time.offset(new Date(startTime), this.getDuration(), 1).getTime();
  this.setSuppressShowEvents(true);
  this.setRange(this.buildRange(startTime, endTime));
  this.setSuppressShowEvents(false);
  this.setCurrent(endTime);
};


/**
 * Creates a range from a start/end time
 * @param {number} start
 * @param {number} end
 * @return {!goog.math.Range}
 */
os.time.TimelineController.prototype.buildRange = function(start, end) {
  return /** @type {!goog.math.Range} */ (new goog.math.Range(start, end));
};


/**
 * Sets the full timeline range
 * @param {!goog.math.Range} range
 */
os.time.TimelineController.prototype.setRange = function(range) {
  // check if range present
  if (this.getLoadRanges().length != 1 || !this.hasExactRange(this.loadRanges_, range)) {
    this.clearLoadRanges();
    this.addLoadRange(range);
  }
};


/**
 * @return {number}
 */
os.time.TimelineController.prototype.getSkip = function() {
  return this.skip_;
};


/**
 * Gets the next frame on the timeline irrespective of any
 * animation or timeline range constraints.
 * @param {number} current current frame value.
 * @param {number} dir < 0 backward, otherwise forward.
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getNextFrame = function(current, dir) {
  var result = new goog.math.Range(0, 0);
  var nextCurrent = this.getNextPosition_(current, dir);
  var nextEnd = nextCurrent - this.getOffset();
  result.start = Math.min(nextCurrent, nextEnd);
  result.end = Math.max(nextCurrent, nextEnd);
  return result;
};


/**
 * Gets the curret frame on the timeline as a range
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getCurrentFrame = function() {
  var result = new goog.math.Range(0, 0);
  var offset = this.current_ - this.getOffset();
  result.start = Math.min(this.current_, offset);
  result.end = Math.max(this.current_, offset);
  return result;
};


/**
 * @param {number} value
 */
os.time.TimelineController.prototype.setSkip = function(value) {
  this.skip_ = Math.max(value, -1);
};


/**
 * Get the start value of the timeline range.
 * @return {number} The start value
 */
os.time.TimelineController.prototype.getStart = function() {
  return this.getLoadRange().start;
};


/**
 * The full timeline range
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getRange = function() {
  return this.getLoadRange();
};


/**
 * Gets the animation range
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getLoadRange = function() {
  return this.loadRanges_.getBounds();
};


/**
 * Gets the animation range
 * @return {goog.math.Range}
 */
os.time.TimelineController.prototype.getAnimationRange = function() {
  if (this.animateRanges_.isEmpty()) {
    var effLoadRange = this.getEffectiveLoadRangeSet();
    if (effLoadRange.isEmpty()) {
      return this.getLoadRange();
    }
    return effLoadRange.getBounds();
  }
  return this.animateRanges_.getBounds();
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.getSuppressShowEvents = function() {
  return this.suppressShowEvents_;
};


/**
 * @param {boolean} value
 */
os.time.TimelineController.prototype.setSuppressShowEvents = function(value) {
  this.suppressShowEvents_ = value;
};


/**
 * Clamps the timeline controller position within the loop start/end dates.
 */
os.time.TimelineController.prototype.clamp = function() {
  var animateRange = this.getAnimationRange();
  if ((this.current_ > animateRange.end && this.lastCurrent_ >= animateRange.end) ||
      (this.lastCurrent_ <= animateRange.start + this.offset_ && this.current_ <= animateRange.start + this.offset_)) {
    if (this.current_ - this.lastCurrent_ > 0) {
      this.first();
    } else {
      this.last();
    }
  }
};


/**
 * Start the timer.
 */
os.time.TimelineController.prototype.play = function() {
  if (this.animationTimer_ && !this.animationTimer_.enabled) {
    this.animationTimer_.start();
    this.dispatchEvent(os.time.TimelineEventType.PLAY);
  }
};


/**
 * Stop the timer.
 */
os.time.TimelineController.prototype.stop = function() {
  if (this.animationTimer_ && this.animationTimer_.enabled) {
    this.animationTimer_.stop();
    this.dispatchEvent(os.time.TimelineEventType.STOP);
  }
};


/**
 * Move current to the start.
 */
os.time.TimelineController.prototype.first = function() {
  var animateRange = this.getAnimationRange();
  this.setCurrent(animateRange.start + this.offset_);
};


/**
 * Move current to the end.
 */
os.time.TimelineController.prototype.last = function() {
  var animateRange = this.getAnimationRange();
  this.setCurrent(animateRange.end);
};


/**
 * If there is another frame to play before the loop resets.
 * @return {boolean}
 */
os.time.TimelineController.prototype.hasNext = function() {
  if (this.hasNextFlag_) {
    this.hasNextFlag_ = false;
    return false;
  }
  var animateRange = this.getAnimationRange();
  var nextFrame = this.getNextFrame(this.current_, 1);
  if (nextFrame.start < animateRange.end && nextFrame.end >= animateRange.end) {
    // has next is true here, but the next animation step will go back
    // to the start of the animation range, causing all subsquent
    // calls to be true, dispite being at the end.
    this.hasNextFlag_ = true;
  }
  return (nextFrame.start < animateRange.end);
};


/**
 * Move current forward a frame.
 */
os.time.TimelineController.prototype.next = function() {
  this.step_(1);
  this.clamp();
};


/**
 * Move current backward a frame.
 */
os.time.TimelineController.prototype.prev = function() {
  this.step_(-1);
  this.clamp();
};


/**
 * @return {os.time.TimelineControllerEvent}
 * @private
 */
os.time.TimelineController.prototype.createShowEvent_ = function() {
  var e = new os.time.TimelineControllerEvent(os.time.TimelineEventType.SHOW);
  e.setData(this.current_, this.fade_, this.current_ - this.offset_);
  return e;
};


/**
 * Ensures that all of the currently defined hold and animation ranges
 * are within a valid full range of the timeline.
 */
os.time.TimelineController.prototype.reconcileRanges = function() {
  if (!this.loadRanges_.isEmpty()) {
    if (this.reconcileRange_(this.animateRanges_)) {
      this.dispatchEvent(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }

    if (this.reconcileRange_(this.holdRanges_)) {
      this.dispatchEvent(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }
};


/**
 * Ensures that the rangeSet items are all
 * within the full range of the timeline. Any that
 * are not, get removed.
 * @param {goog.math.RangeSet} rangeSet
 * @return {boolean} true if rangeSet was changed.
 * @private
 */
os.time.TimelineController.prototype.reconcileRange_ = function(rangeSet) {
  var altered = false;
  var rangesInSet = goog.iter.toArray(rangeSet);
  var range;
  for (var i = 0; i < rangesInSet.length; i = i + 1) {
    range = rangesInSet[i];
    if (!this.loadRanges_.contains(range)) {
      rangeSet.remove(range);
      altered = true;
    }
  }
  return altered;
};


/**
 * @param {goog.events.Event} event
 * @private
 */
os.time.TimelineController.prototype.onAnimationTimer_ = function(event) {
  this.step_(1);
  this.clamp();
};


/**
 * @private
 */
os.time.TimelineController.prototype.onResetTimer_ = function() {
  this.dispatchEvent(new os.time.TimelineControllerEvent(os.time.TimelineEventType.RESET));
};


/**
 * @private
 */
os.time.TimelineController.prototype.dispatchShowEvent_ = function() {
  if (!this.suppressShowEvents_) {
    var e = this.createShowEvent_();
    this.dispatchEvent(e);
    this.lastEvent_ = e;
  }
};


/**
 * Use scheduleReset to ensure that the TimelineControllerEvent.RESET event is only fired once. This way each member
 * of the class that should send a reset when it is changed will still only send a single RESET event if a bunch of them
 * are modified together.
 * @private
 */
os.time.TimelineController.prototype.scheduleReset_ = function() {
  this.resetTimer_.start();
};


/**
 * Updates the current position accounting for any animateRanges_
 * @param {number} dir
 * @private
 */
os.time.TimelineController.prototype.adjustCurrent_ = function(dir) {
  // var offset = dir < 0 ? this.skip_ : 0;
  var nextFrame = this.getNextFrame(this.current_, dir);
  var nextPosition = dir > 0 ? nextFrame.start : nextFrame.end;
  // var pos = nextPosition - offset;
  if (!this.animateRanges_.isEmpty()) {
    if (!this.animateRanges_.containsValue(nextPosition)) {
      // find the nearest range
      var range = this.findNextNearestRange_(this.animateRanges_, dir, this.current_) || this.getRange();
      if (goog.math.Range.equals(this.lastRange_, range)) {
        range = this.findNextNearestRange_(this.animateRanges_, dir, nextPosition) || this.getRange();
      }

      if (dir > 0) {
        // align the left edge of the window with the start of the next animation range, minus one skip interval
        this.current_ = range.start + (this.offset_ - this.skip_);
      } else {
        // align the right edge of the window with the end of the previous animation range, plus one skip interval
        this.current_ = range.end + this.skip_;
      }

      var currentFrame = this.getCurrentFrame();
      if (goog.math.Range.contains(currentFrame, range)) {
        this.current_ = dir > 0 ? range.start : range.end;
      }

      this.lastRange_ = range;
    }
  } else {
    var effLoadRangeSet = this.getEffectiveLoadRangeSet();
    if (!effLoadRangeSet.isEmpty() && !effLoadRangeSet.containsValue(nextPosition)) {
      // find the nearest range
      var range = this.findNextNearestRange_(effLoadRangeSet, dir, this.current_) || effLoadRangeSet.getBounds();
      if (goog.math.Range.equals(this.lastRange_, range)) {
        range = this.findNextNearestRange_(effLoadRangeSet, dir, nextPosition) || effLoadRangeSet.getBounds();
      }

      if (dir > 0) {
        // align the left edge of the window with the start of the next animation range, minus one skip interval
        this.current_ = range.start + (this.offset_ - this.skip_);
      } else {
        // align the right edge of the window with the end of the previous animation range, plus one skip interval
        this.current_ = range.end + this.skip_;
      }

      var currentFrame = this.getCurrentFrame();
      if (goog.math.Range.contains(currentFrame, range)) {
        this.current_ = dir > 0 ? range.start : range.end;
      }

      this.lastRange_ = range;
    }
  }
};


/**
 * Returns the next position
 * @param {number} current
 * @param {number} dir
 * @return {number}
 * @private
 */
os.time.TimelineController.prototype.getNextPosition_ = function(current, dir) {
  return current + (dir * this.skip_);
};


/**
 * Finds the next or previous nearest range in the rangeSet to position
 * @param {goog.math.RangeSet} rangeSet source range set
 * @param {number} dir if < 0 looks backwards, otherwise forward.
 * @param {number} position
 * @return {?goog.math.Range} nearest range or null
 * @private
 */
os.time.TimelineController.prototype.findNextNearestRange_ = function(rangeSet, dir, position) {
  var range = null;
  var i;
  var r;
  try {
    var ranges = goog.iter.toArray(rangeSet);
    if (dir < 0) {
      for (i = ranges.length - 1; i >= 0; i = i - 1) {
        r = ranges[i];
        if (r.end <= position) {
          range = r;
          break;
        }
      }
    } else {
      for (i = 0; i < ranges.length; i = i + 1) {
        r = ranges[i];
        if (r.start >= position) {
          range = r;
          break;
        }
      }
    }
    return range;
  } catch (err) {
    throw new Error('findNextNearestRange_ exception:' + err.message);
  }
};


/**
 * @param {number} dir ( 1 forward, -1 backward)
 * @private
 */
os.time.TimelineController.prototype.step_ = function(dir) {
  this.adjustCurrent_(dir);
  this.setCurrent(this.getNextPosition_(this.current_, dir));
};


/**
 * @inheritDoc
 */
os.time.TimelineController.prototype.persist = function(opt_to) {
  var obj = opt_to || {};
  obj['start'] = this.getStart();
  obj['end'] = this.getEnd();
  obj['duration'] = this.getDuration();
  obj['current'] = this.getCurrent();
  obj['offset'] = this.getOffset();
  obj['fade'] = this.getFade();
  obj['skip'] = this.getSkip();
  obj['playing'] = this.isPlaying();
  obj['sliceRanges'] = this.sliceRanges_.clone();
  obj['loadRanges'] = this.loadRanges_.clone();
  obj['animateRanges'] = this.animateRanges_.clone();
  obj['holdRanges'] = this.holdRanges_.clone();

  return obj;
};


/**
 * @inheritDoc
 */
os.time.TimelineController.prototype.restore = function(config) {
  this.setRange(this.buildRange(config['start'], config['end']));
  this.setDuration(config['duration']);
  this.setOffset(config['offset']);
  this.setFade(config['fade']);
  this.setSkip(config['skip']);
  this.setCurrent(config['current']);
  this.setSliceRanges(config['sliceRanges']);
  this.setLoadRanges(config['loadRanges']);
  this.setAnimateRanges(config['animateRanges']);
  this.setHoldRanges(config['holdRanges']);
  this.updateOffetsAndCurrent_();

  if (config['playing']) {
    this.play();
  } else {
    this.stop();
  }
};


/**
 * Updates the current position to the beginning of the anmation sequence, and
 * re-computes the step size and offests based on the current animation range.
 * @private
 */
os.time.TimelineController.prototype.updateOffetsAndCurrent_ = function() {
  os.time.timeline.setDefaultOffsetForRange(this, this.getSmallestAnimateRangeLength());
};


/**
 * Repositions the current playback position to the start of the
 * timeline animation.
 */
os.time.TimelineController.prototype.moveToStart = function() {
  this.setCurrent(this.getAnimationRange().start);
};


/**
 * Repositions the current playback position to the end of the
 * timeline animation.
 */
os.time.TimelineController.prototype.moveToEnd = function() {
  this.setCurrent(this.getAnimationRange().end);
};


/**
 * Clears all slices
 */
os.time.TimelineController.prototype.clearSliceRanges = function() {
  if (!this.sliceRanges_.isEmpty()) {
    this.sliceRanges_.clear();
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Adds a slice from a timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.addSliceRange = function(timerange) {
  var cloned = new goog.math.Range(0, 1); // cloning or making a new range sets start to the lower of start/end
  cloned.start = timerange.start; // manually set start & end
  cloned.end = timerange.end;
  var cleanedRange = this.cleanSliceRange(cloned);
  if (cleanedRange) {
    var tr = this.sliceRanges_.clone();
    if (cleanedRange.start > cleanedRange.end) { // selected across a day, split into 2 ranges
      var range2 = new goog.math.Range(0, cleanedRange.end);
      this.sliceRanges_.add(range2);
      cleanedRange = new goog.math.Range(cleanedRange.start, os.time.millisecondsInDay);
    }

    this.sliceRanges_.add(cleanedRange.clone());

    // emit a changed event if the timeline has actually changed.
    if (!goog.math.RangeSet.equals(tr, this.sliceRanges_)) {
      this.calcRangeCache_.clear();
      this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
      if (tr.isEmpty() && !this.sliceRanges_.isEmpty()) {
        this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
      }
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }
};


/**
 * Adds a slice from a timerange
 * @param {goog.math.Range} timerange
 * @return {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.cleanSliceRange = function(timerange) {
  if (timerange.end - timerange.start >= os.time.millisecondsInDay) {
    var msg = 'Slice size must be less than a day, setting to largest allowable';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.INFO);
    return new goog.math.Range(0, os.time.millisecondsInDay);
  } else {
    var tr = new goog.math.Range(0, 1); // make a safe copy
    tr.start = timerange.start;
    tr.end = timerange.end;
    if (timerange.start > os.time.millisecondsInDay) { // only care about hours, mins, seconds, milliseconds
      tr.start = timerange.start % os.time.millisecondsInDay;
    }
    if (timerange.end > os.time.millisecondsInDay) { // only care about hours, mins, seconds, milliseconds
      tr.end = timerange.end % os.time.millisecondsInDay;
    }
    return tr;
  }
};


/**
 * Updates an existing slice timerange
 * @param {goog.math.Range} newTimerange
 * @param {goog.math.Range} oldTimerange
 * @return {boolean}
 */
os.time.TimelineController.prototype.updateSliceRange = function(newTimerange, oldTimerange) {
  var newRange = this.cleanSliceRange(newTimerange);
  var oldRange = this.cleanSliceRange(oldTimerange);
  if (newRange.start != oldRange.start || newRange.end != oldRange.end) {
    if (oldRange.end >= os.time.millisecondsInDay - 1000) { // timeline snaps the prior second, delete range properly
      oldRange.end = os.time.millisecondsInDay;
    }
    this.sliceRanges_.remove(oldRange);
    this.addSliceRange(newRange);
  }
  return true;
};


/**
 * Removes a slice timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.removeSliceRange = function(timerange) {
  var range = this.cleanSliceRange(timerange);
  var tr = this.sliceRanges_.clone();
  if (range.end >= os.time.millisecondsInDay - 1000) { // timeline snaps the prior second, delete range properly
    range.end = os.time.millisecondsInDay;
  }
  this.sliceRanges_.remove(range);

  // emit a changed event if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.sliceRanges_)) {
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    if (!tr.isEmpty() && this.sliceRanges_.isEmpty()) {
      this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
    }
    this.dispatchShowEvent_();
    this.scheduleReset_();
  }
};


/**
 * Sets the slice ranges.
 * @param {?goog.math.RangeSet} ranges
 */
os.time.TimelineController.prototype.setSliceRanges = function(ranges) {
  if (ranges) {
    var tr = this.sliceRanges_.clone();
    this.sliceRanges_ = ranges.clone();
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    if ((!tr.isEmpty() && this.sliceRanges_.isEmpty()) ||
        (tr.isEmpty() && !this.sliceRanges_.isEmpty())) {
      this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
    }
    this.dispatchShowEvent_();
    this.scheduleReset_();
  }
};


/**
 * Returns all slice ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getSliceRanges = function() {
  return goog.iter.toArray(this.sliceRanges_);
};


/**
 * Returns all load ranges with slices.
 * @return {goog.math.RangeSet}
 */
os.time.TimelineController.prototype.getSliceRangeSet = function() {
  return this.sliceRanges_.clone();
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.hasSliceRanges = function() {
  return !this.sliceRanges_.isEmpty();
};


/**
 * Returns all load ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getEffectiveSliceRanges = function() {
  return goog.iter.toArray(this.hasSliceRanges() ? this.getEffectiveLoadRangeSet() : []);
};


/**
 * Returns all load ranges.
 * @return {goog.math.RangeSet}
 */
os.time.TimelineController.prototype.getEffectiveLoadRangeSet = function() {
  var ranges = this.getLoadRangeSet(); // return loaded range if no slices
  if (this.hasSliceRanges()) {
    if (this.calcRangeCache_.isEmpty()) {
      var slicesApplied = new goog.math.RangeSet();
      var slices = this.getSliceRanges();
      var loadRanges = this.getLoadRanges(); // return loaded range if no slices
      for (var i = 0; i < loadRanges.length; i++) { // for range in loadRanges
        var length = Math.ceil((loadRanges[i].end - loadRanges[i].start) / os.time.millisecondsInDay); // #days in range
        if (loadRanges[i].end % os.time.millisecondsInDay < loadRanges[i].start % os.time.millisecondsInDay + 1) {
          length++; // extra partial day
        }
        var firstDay = loadRanges[i].start - loadRanges[i].start % os.time.millisecondsInDay; // first day of the range
        for (var j = 0; j < length; j++) { // take a slice out of each day
          var day = firstDay + j * os.time.millisecondsInDay; // start time of current day in range
          var dayRange = this.buildRange(day, day + os.time.millisecondsInDay - 1000); // range extending the full day
          var finalRange = goog.math.Range.intersection(dayRange, loadRanges[i]); // clip  to match first / last day
          for (var k = 0; k < slices.length; k++) { // for slice in slices
            var daySlice = this.buildRange(day + slices[k].start, day + slices[k].end); // add slice to day
            var intersectRangeSet = goog.math.Range.intersection(daySlice, finalRange);
            if (intersectRangeSet) {
              slicesApplied.add(intersectRangeSet); // intersect and store
            }
          }
        }
      }
      this.calcRangeCache_ = slicesApplied;
    }
    ranges = this.calcRangeCache_.clone();
  }
  return ranges;
};


/**
 * Returns all load ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getEffectiveLoadRanges = function() {
  return goog.iter.toArray(this.getEffectiveLoadRangeSet());
};


/**
 * Clears all load ranges
 * @param {boolean=} opt_loud
 */
os.time.TimelineController.prototype.clearLoadRanges = function(opt_loud) {
  if (!this.loadRanges_.isEmpty()) {
    this.loadRanges_.clear();
    this.calcRangeCache_.clear();
    if (opt_loud) {
      this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }
};


/**
 * Adds a load timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.addLoadRange = function(timerange) {
  var tr = this.loadRanges_.clone();
  this.loadRanges_.add(timerange.clone());

  // emit a changed evet if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.loadRanges_)) {
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    var numPrev = goog.iter.toArray(tr).length;
    var numNow = this.getLoadRanges().length;
    if (numPrev === 1 && numNow > 1 || numNow === 1) { // consider when ranges are combined!
      this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
    }
    this.dispatchShowEvent_();
    this.scheduleReset_();
  }
};


/**
 * Updates an existing load timerange
 * @param {goog.math.Range} newTimerange
 * @param {goog.math.Range} oldTimerange
 */
os.time.TimelineController.prototype.updateLoadRange = function(newTimerange, oldTimerange) {
  if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
    this.loadRanges_.remove(oldTimerange.clone());
    this.addLoadRange(newTimerange);
  }
};


/**
 * Checks for an existing timerange with a start or end match
 * @param {goog.math.RangeSet} rangeSet
 * @param {goog.math.Range} timerange
 * @return {?goog.math.Range}
 */
os.time.TimelineController.prototype.hasRange = function(rangeSet, timerange) {
  return goog.iter.nextOrValue(goog.iter.filter(rangeSet, function(range) {
    return (range.start === timerange.start || range.end === timerange.end);
  }), null);
};


/**
 * Checks for an existing timerange with an exact start and end match
 * @param {goog.math.RangeSet} rangeSet
 * @param {goog.math.Range} timerange
 * @return {?goog.math.Range}
 */
os.time.TimelineController.prototype.hasExactRange = function(rangeSet, timerange) {
  return goog.iter.nextOrValue(goog.iter.filter(rangeSet, function(range) {
    return (range.start === timerange.start && range.end === timerange.end);
  }), null);
};


/**
 * Removes a load timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.removeLoadRange = function(timerange) {
  var tr = this.loadRanges_.clone();
  this.loadRanges_.remove(timerange);
  if (!this.loadRanges_.isEmpty()) {
    if (!goog.math.RangeSet.equals(tr, this.loadRanges_)) { // emit a changed evet if the timeline has actually changed.
      this.calcRangeCache_.clear();
      this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
      var numPrev = goog.iter.toArray(tr).length;
      var numNow = this.getLoadRanges().length;
      if (numPrev > 1 && numNow === 1) {
        this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
      }
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  } else { // this shouldn't happen, but if it does
    this.loadRanges_.remove(timerange); // add it back to the UI
    this.loadRanges_.add(timerange.clone());
    var msg = 'At least one load range must always be present';
    os.alert.AlertManager.getInstance().sendAlert(msg, os.alert.AlertEventSeverity.INFO);
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    this.dispatchShowEvent_();
    this.scheduleReset_();
  }
};


/**
 * Sets the load ranges.
 * @param {?goog.math.RangeSet} ranges
 */
os.time.TimelineController.prototype.setLoadRanges = function(ranges) {
  if (ranges) {
    var numPrev = this.getLoadRanges().length;
    var numNow = goog.iter.toArray(ranges).length;
    if ((numPrev === 1 && numNow != 1) || (numPrev > 1 && numNow === 1)) {
      this.dispatchEvent(os.time.TimelineEventType.REFRESH_LOAD);
    }
    this.loadRanges_ = ranges.clone();
    this.calcRangeCache_.clear();
    this.dispatchEvent(os.time.TimelineEventType.SLICE_RANGE_CHANGED);
    this.dispatchEvent(os.time.TimelineEventType.RANGE_CHANGED);
    this.dispatchShowEvent_();
    this.scheduleReset_();
  }
};


/**
 * Returns all load ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getLoadRanges = function() {
  return goog.iter.toArray(this.loadRanges_);
};


/**
 * Returns all load ranges.
 * @return {goog.math.RangeSet}
 */
os.time.TimelineController.prototype.getLoadRangeSet = function() {
  return this.loadRanges_.clone();
};


/**
 * Clears all animate ranges
 */
os.time.TimelineController.prototype.clearAnimateRanges = function() {
  if (!this.animateRanges_.isEmpty()) {
    this.animateRanges_.clear();
    this.dispatchEvent(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Adds a timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.addAnimateRange = function(timerange) {
  var tr = this.animateRanges_.clone();
  this.animateRanges_.add(timerange.clone());

  // emit a changed evet if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.animateRanges_)) {
    this.dispatchEvent(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Updates an existing timerange
 * @param {goog.math.Range} newTimerange
 * @param {goog.math.Range} oldTimerange
 */
os.time.TimelineController.prototype.updateAnimateRange = function(newTimerange, oldTimerange) {
  if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
    this.animateRanges_.remove(oldTimerange);
    this.addAnimateRange(newTimerange);
  }
};


/**
 * Removes a timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.removeAnimateRange = function(timerange) {
  var tr = this.animateRanges_.clone();
  this.animateRanges_.remove(timerange);

  // emit a changed event if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.animateRanges_)) {
    this.dispatchEvent(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Sets the animation ranges.
 * @param {?goog.math.RangeSet} ranges
 */
os.time.TimelineController.prototype.setAnimateRanges = function(ranges) {
  if (ranges) {
    this.animateRanges_ = ranges.clone();
    this.dispatchEvent(os.time.TimelineEventType.ANIMATE_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Returns all animation ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getAnimationRanges = function() {
  return goog.iter.toArray(this.animateRanges_);
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.hasAnimationRanges = function() {
  return !this.animateRanges_.isEmpty();
};


/**
 * @return {boolean}
 */
os.time.TimelineController.prototype.hasHoldRanges = function() {
  return !this.holdRanges_.isEmpty();
};


/**
 * Returns all hold ranges.
 * @return {!Array<goog.math.Range>}
 */
os.time.TimelineController.prototype.getHoldRanges = function() {
  return goog.iter.toArray(this.holdRanges_);
};


/**
 * Sets the hold ranges.
 * @param {?goog.math.RangeSet} ranges
 */
os.time.TimelineController.prototype.setHoldRanges = function(ranges) {
  if (ranges) {
    this.holdRanges_ = ranges.clone();
    this.dispatchEvent(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Removes a hold range
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.removeHoldRange = function(timerange) {
  var tr = this.holdRanges_.clone();

  this.holdRanges_.remove(timerange);

  // emit a changed evet if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.holdRanges_)) {
    this.dispatchEvent(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Clears all hold ranges
 */
os.time.TimelineController.prototype.clearHoldRanges = function() {
  if (!this.holdRanges_.isEmpty()) {
    this.holdRanges_.clear();
    this.dispatchEvent(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Adds a hold timerange
 * @param {goog.math.Range} timerange
 */
os.time.TimelineController.prototype.addHoldRange = function(timerange) {
  var tr = this.holdRanges_.clone();
  this.holdRanges_.add(timerange.clone());

  // emit a changed evet if the timeline has actually changed.
  if (!goog.math.RangeSet.equals(tr, this.holdRanges_)) {
    this.dispatchEvent(os.time.TimelineEventType.HOLD_RANGE_CHANGED);
    this.dispatchShowEvent_();
  }
};


/**
 * Updates an existing hold timerange
 * @param {goog.math.Range} newTimerange
 * @param {goog.math.Range} oldTimerange
 */
os.time.TimelineController.prototype.updateHoldRange = function(newTimerange, oldTimerange) {
  if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
    this.holdRanges_.remove(oldTimerange);
    this.addHoldRange(newTimerange);
  }
};


/**
 * Returns true if the hold ranges contain the range
 * @param {goog.math.Range} timerange
 * @return {boolean}
 */
os.time.TimelineController.prototype.holdRangeContains = function(timerange) {
  return this.holdRanges_.contains(timerange);
};


/**
 * Returns true if the hold ranges contain the time
 * @param {?os.time.ITime} time
 * @return {boolean}
 */
os.time.TimelineController.prototype.holdRangeContainsTime = function(time) {
  if (time && !this.holdRanges_.isEmpty()) {
    if (time.getStart() === time.getEnd()) {
      return this.holdRanges_.containsValue(time.getStart());
    } else {
      return this.holdRangeContains(new goog.math.Range(time.getStart(), time.getEnd()));
    }
  }
  return false;
};
