goog.module('os.time.TimelineController');
goog.module.declareLegacyNamespace();

const Timer = goog.require('goog.Timer');
const googArray = goog.require('goog.array');
const Delay = goog.require('goog.async.Delay');
const EventTarget = goog.require('goog.events.EventTarget');
const iter = goog.require('goog.iter');
const Range = goog.require('goog.math.Range');
const RangeSet = goog.require('goog.math.RangeSet');
const AlertEventSeverity = goog.require('os.alert.AlertEventSeverity');
const AlertManager = goog.require('os.alert.AlertManager');
const Settings = goog.require('os.config.Settings');
const osTime = goog.require('os.time');
const Duration = goog.require('os.time.Duration');
const TimeRange = goog.require('os.time.TimeRange');
const TimelineControllerEvent = goog.require('os.time.TimelineControllerEvent');
const TimelineEventType = goog.require('os.time.TimelineEventType');
const timeline = goog.require('os.time.timeline');

const IPersistable = goog.requireType('os.IPersistable');


/**
 * Controls time state within os.js.
 *
 * @implements {IPersistable}
 * @todo If this is extended (ie, MyTimelineController), the application should add the getInstance function instead
 *    of using goog.addSingletonGetter. If you have a better idea on how to do that, go for it, but that was my
 *    initial thought.
 */
class TimelineController extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The frames per second for the animation.
     * @type {number}
     * @private
     */
    this.fps_ = /** @type {number} */ (Settings.getInstance().get(['tlc', 'fps'], 2));

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
    this.duration_ = Duration.DAY;

    /**
     * @type {boolean}
     * @private
     */
    this.fade_ = false;

    /**
     * @type {boolean}
     * @private
     */
    this.lock_ = false;

    /**
     * @type {number}
     * @private
     */
    this.lockRange_ = 0;

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
    this.autoConfigure_ = true;

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
     * @type {TimelineControllerEvent}
     * @private
     */
    this.lastEvent_ = null;

    /**
     * Timer to fire off events.
     * @type {Timer}
     * @private
     */
    this.animationTimer_ = new Timer(1000 / this.fps_);
    this.animationTimer_.listen(Timer.TICK, this.onAnimationTimer_, false, this);

    /**
     * @type {Delay}
     * @private
     */
    this.resetTimer_ = new Delay(this.onResetTimer_, 50, this);

    /**
     * @type {RangeSet}
     * @private
     */
    this.loadRanges_ = new RangeSet();
    this.addLoadRange(new Range(0, 0));


    /**
     * @type {RangeSet}
     * @private
     */
    this.calcRangeCache_ = new RangeSet();

    /**
     * @type {RangeSet}
     * @private
     */
    this.sliceRanges_ = new RangeSet();

    /**
     * @type {RangeSet}
     * @private
     */
    this.animateRanges_ = new RangeSet();

    /**
     * @type {RangeSet}
     * @private
     */
    this.holdRanges_ = new RangeSet();

    /**
     * The minimum range allowed to be added
     * to the time line controller.
     * @type {number}
     */
    this.minRange = 1000;

    /**
     * @type {?Range}
     * @private
     */
    this.lastRange_ = null;

    /**
     * @type {boolean}
     * @private
     */
    this.hasNextFlag_ = false;

    this.initialize_();
  }

  /**
   * Initialize the timeline controller.
   *
   * @private
   * @todo This is temporary until we have user options to set the default time on startup.
   */
  initialize_() {
    var duration = Duration.DAY;
    var start = osTime.toUTCDate(new Date());
    start = osTime.floor(start, duration);
    var end = osTime.offset(start, duration, 1);

    this.setIncludeEnd(true);
    this.setSuppressShowEvents(true);
    this.setRange(this.buildRange(start.getTime(), end.getTime()));
    this.setDuration(duration);
    this.setOffset(this.getSmallestAnimateRangeLength());
    this.setFade(false);
    this.setLock(false);
    this.setAutoConfigure(true);
    this.setCurrent(end.getTime());
    this.setSuppressShowEvents(false);
    this.updateOffetsAndCurrent_();
  }

  /**
   * @return {boolean}
   */
  isPlaying() {
    return this.animationTimer_ != null && this.animationTimer_.enabled;
  }

  /**
   * Gets the current time range. This corresponds to the blue window on the timeline.
   *
   * @return {number}
   */
  getCurrent() {
    return this.current_;
  }

  /**
   * Setter for current time range. This corresponds to the blue window on the timeline.
   *
   * @param {number} value
   */
  setCurrent(value) {
    if (this.current_ !== value) {
      this.lastCurrent_ = this.current_;
      this.current_ = value;
      this.dispatchShowEvent_();
    }
  }

  /**
   * Gets the current range of the controller.
   *
   * @return {TimeRange}
   */
  getCurrentTimeRange() {
    return new TimeRange(new Date(this.current_ - this.offset_), new Date(this.current_));
  }

  /**
   * Gets the current range of the controller.
   *
   * @return {Range}
   */
  getCurrentRange() {
    return new Range(this.current_ - this.offset_, this.current_);
  }

  /**
   * @return {string}
   */
  getDuration() {
    return this.duration_;
  }

  /**
   * @param {string} value
   */
  setDuration(value) {
    if (this.duration_ != value) {
      this.duration_ = value;
      this.clearAnimateRanges();
      this.clearHoldRanges();
      this.dispatchEvent(TimelineEventType.DURATION_CHANGE);
    }
  }

  /**
   * Get the end value of the timeline range.
   *
   * @return {number} The end value
   */
  getEnd() {
    return this.getLoadRange().end;
  }

  /**
   * @return {boolean}
   */
  getFade() {
    return this.fade_;
  }

  /**
   * @param {boolean} value
   */
  setFade(value) {
    this.fade_ = value;
    this.dispatchEvent(TimelineEventType.FADE_TOGGLE);
  }

  /**
   * @return {boolean}
   */
  getLock() {
    return this.lock_;
  }

  /**
   * @return {boolean}
   */
  toggleLock() {
    this.lock_ = !this.lock_;
    this.updateBasedOnLock_();
    return this.lock_;
  }

  /**
   * @param {boolean} value
   */
  setLock(value) {
    this.lock_ = value;
    this.dispatchEvent(TimelineEventType.LOCK_TOGGLE);
  }

  /**
   * Updates the lock
   *
   * @param {boolean} value
   */
  updateLock(value) {
    this.lock_ = value;
    this.updateBasedOnLock_();
    this.dispatchEvent(TimelineEventType.LOCK_TOGGLE);
  }

  /**
   * Update other timeline values where appropriate if lock is on
   */
  updateBasedOnLock_() {
    if (this.lock_) {
      this.lockRange_ = this.getCurrentRange().end - this.getCurrentRange().start;
      if (this.autoConfigure_) {
        this.setSkip(this.lockRange_);
      }
      this.first();
    }
  }

  /**
   * Getter for lock range.
   * @return {number}
   */
  getLockRange() {
    return this.lockRange_;
  }

  /**
   * Sets the lock range.
   * @param {number} range
   */
  setLockRange(range) {
    this.lockRange_ = range;
  }

  /**
   * Getter for framerate.
   *
   * @return {number}
   */
  getFps() {
    return this.fps_;
  }

  /**
   * Setter for framerate.
   *
   * @param {number} fps
   */
  setFps(fps) {
    var wasPlaying = this.isPlaying();
    if (this.animationTimer_) {
      this.animationTimer_.dispose();
    }

    this.fps_ = fps;
    this.animationTimer_ = new Timer(1000 / this.fps_);
    this.animationTimer_.listen(Timer.TICK, this.onAnimationTimer_, false, this);

    if (wasPlaying) {
      this.animationTimer_.start();
    }

    Settings.getInstance().set(['tlc', 'fps'], fps);
    this.dispatchEvent(TimelineEventType.FPS_CHANGE);
  }

  /**
   * @return {boolean}
   */
  getIncludeEnd() {
    return this.includeEnd_;
  }

  /**
   * @param {boolean} value
   */
  setIncludeEnd(value) {
    this.includeEnd_ = value;
  }

  /**
   * @return {?TimelineControllerEvent}
   */
  getLastEvent() {
    return this.lastEvent_;
  }

  /**
   * @return {number}
   */
  getLoopStart() {
    return this.getAnimationRange().start;
  }

  /**
   * @return {number}
   */
  getLoopEnd() {
    return this.getAnimationRange().end;
  }

  /**
   * @return {number}
   */
  getSmallestAnimateRangeLength() {
    var rangeSet = this.animateRanges_.isEmpty() ? this.getEffectiveLoadRangeSet() : this.animateRanges_;
    var values = [];
    iter.forEach(rangeSet.__iterator__(false), function(value) {
      values.push(value.getLength());
    });
    googArray.sort(values);
    return values[0];
  }

  /**
   * @return {number}
   */
  getOffset() {
    return this.offset_;
  }

  /**
   * @param {number} value
   */
  setOffset(value) {
    var old = this.offset_;
    this.offset_ = Math.max(value, 0);

    if (old != this.offset_) {
      this.dispatchShowEvent_();
    }
  }

  /**
   * Sets the current range using a start value and the duration.
   *
   * @param {number} value
   */
  setRangeStart(value) {
    var startTime = osTime.floor(new Date(value), this.getDuration()).getTime();
    var endTime = osTime.offset(new Date(startTime), this.getDuration(), 1).getTime();
    this.setSuppressShowEvents(true);
    this.setRange(this.buildRange(startTime, endTime));
    this.setSuppressShowEvents(false);
    this.setCurrent(endTime);
  }

  /**
   * Creates a range from a start/end time
   *
   * @param {number} start
   * @param {number} end
   * @return {!Range}
   */
  buildRange(start, end) {
    return /** @type {!Range} */ (new Range(start, end));
  }

  /**
   * Sets the load range. This corresponds to the yellow window on the timeline.
   *
   * @param {!Range} range
   */
  setRange(range) {
    // check if range present
    if (this.getLoadRanges().length != 1 || !this.hasExactRange(this.loadRanges_, range)) {
      this.clearLoadRanges();
      this.addLoadRange(range);
    }
  }

  /**
   * @return {number}
   */
  getSkip() {
    return this.skip_;
  }

  /**
   * Gets the next frame on the timeline irrespective of any
   * animation or timeline range constraints.
   *
   * @param {number} current current frame value.
   * @param {number} dir < 0 backward, otherwise forward.
   * @return {Range}
   */
  getNextFrame(current, dir) {
    var result = new Range(0, 0);
    var nextCurrent = this.getNextPosition_(current, dir);
    var nextEnd = nextCurrent - this.getOffset();
    result.start = Math.min(nextCurrent, nextEnd);
    result.end = Math.max(nextCurrent, nextEnd);
    return result;
  }

  /**
   * Gets the curret frame on the timeline as a range
   *
   * @return {Range}
   */
  getCurrentFrame() {
    var result = new Range(0, 0);
    var offset = this.current_ - this.getOffset();
    result.start = Math.min(this.current_, offset);
    result.end = Math.max(this.current_, offset);
    return result;
  }

  /**
   * @param {number} value
   */
  setSkip(value) {
    this.skip_ = Math.max(value, -1);
  }

  /**
   * Getter for auto configure setting.
   * @return {boolean}
   */
  getAutoConfigure() {
    return this.autoConfigure_;
  }

  /**
   * Setter for auto configure setting.
   * @param {boolean} value
   */
  setAutoConfigure(value) {
    this.autoConfigure_ = value;
  }

  /**
   * Get the start value of the timeline load range.
   *
   * @return {number} The start value
   */
  getStart() {
    return this.getLoadRange().start;
  }

  /**
   * Gets the load range. This corresponds to the yellow box on the timeline.
   *
   * @return {Range}
   */
  getRange() {
    return this.getLoadRange();
  }

  /**
   * Gets the load range. This corresponds to the yellow box on the timeline.
   *
   * @return {Range}
   */
  getLoadRange() {
    return this.loadRanges_.getBounds();
  }

  /**
   * Gets the animation range
   *
   * @return {Range}
   */
  getAnimationRange() {
    if (this.animateRanges_.isEmpty()) {
      var effLoadRange = this.getEffectiveLoadRangeSet();
      if (effLoadRange.isEmpty()) {
        return this.getLoadRange();
      }
      return effLoadRange.getBounds();
    }
    return this.animateRanges_.getBounds();
  }

  /**
   * @return {boolean}
   */
  getSuppressShowEvents() {
    return this.suppressShowEvents_;
  }

  /**
   * @param {boolean} value
   */
  setSuppressShowEvents(value) {
    this.suppressShowEvents_ = value;
  }

  /**
   * Clamps the timeline controller position within the loop start/end dates.
   */
  clamp() {
    var animateRange = this.getAnimationRange();
    if ((this.current_ > animateRange.end && this.lastCurrent_ >= animateRange.end) ||
        (this.lastCurrent_ <= animateRange.start + this.offset_ && this.current_ <= animateRange.start) ||
        (this.lock_ && this.offset_ === 0)) {
      if (this.current_ - this.lastCurrent_ > 0) {
        this.first();
      } else {
        this.last();
      }
    }
  }

  /**
   * Start the timer.
   */
  play() {
    if (this.animationTimer_ && !this.animationTimer_.enabled) {
      this.animationTimer_.start();
      this.dispatchEvent(TimelineEventType.PLAY);
    }
  }

  /**
   * Stop the timer.
   */
  stop() {
    if (this.animationTimer_ && this.animationTimer_.enabled) {
      this.animationTimer_.stop();
      this.dispatchEvent(TimelineEventType.STOP);
    }
  }

  /**
   * Move current to the start.
   */
  first() {
    var animateRange = this.getAnimationRange();
    if (this.getLock()) {
      this.setOffset(this.lockRange_);
    }
    this.setCurrent(animateRange.start + this.offset_);
  }

  /**
   * Move current to the end.
   */
  last() {
    var animateRange = this.getAnimationRange();
    if (this.getLock()) {
      this.setOffset(animateRange.getLength());
    }
    this.setCurrent(animateRange.end);
  }

  /**
   * If there is another frame to play before the loop resets.
   *
   * @return {boolean}
   */
  hasNext() {
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
  }

  /**
   * Move current forward a frame.
   */
  next() {
    this.step_(1);
    this.clamp();
  }

  /**
   * Move current backward a frame.
   */
  prev() {
    this.step_(-1);
    this.clamp();
  }

  /**
   * @return {TimelineControllerEvent}
   * @private
   */
  createShowEvent_() {
    var e = new TimelineControllerEvent(TimelineEventType.SHOW);
    e.setData(this.current_, this.fade_, this.current_ - this.offset_);
    return e;
  }

  /**
   * Ensures that all of the currently defined hold and animation ranges
   * are within a valid full range of the timeline.
   */
  reconcileRanges() {
    if (!this.loadRanges_.isEmpty()) {
      if (this.reconcileRange_(this.animateRanges_)) {
        this.dispatchEvent(TimelineEventType.ANIMATE_RANGE_CHANGED);
        this.dispatchShowEvent_();
      }

      if (this.reconcileRange_(this.holdRanges_)) {
        this.dispatchEvent(TimelineEventType.HOLD_RANGE_CHANGED);
        this.dispatchShowEvent_();
      }
    }
  }

  /**
   * Ensures that the rangeSet items are all
   * within the full range of the timeline. Any that
   * are not, get removed.
   *
   * @param {RangeSet} rangeSet
   * @return {boolean} true if rangeSet was changed.
   * @private
   */
  reconcileRange_(rangeSet) {
    var altered = false;
    var rangesInSet = iter.toArray(rangeSet);
    var range;
    for (var i = 0; i < rangesInSet.length; i = i + 1) {
      range = rangesInSet[i];
      if (!this.loadRanges_.contains(range)) {
        rangeSet.remove(range);
        altered = true;
      }
    }
    return altered;
  }

  /**
   * @param {goog.events.Event} event
   * @private
   */
  onAnimationTimer_(event) {
    this.step_(1);
    this.clamp();
  }

  /**
   * @private
   */
  onResetTimer_() {
    this.dispatchEvent(new TimelineControllerEvent(TimelineEventType.RESET));
  }

  /**
   * @private
   */
  dispatchShowEvent_() {
    if (!this.suppressShowEvents_) {
      var e = this.createShowEvent_();
      this.dispatchEvent(e);
      this.lastEvent_ = e;
    }
  }

  /**
   * Use scheduleReset to ensure that the TimelineControllerEvent.RESET event is only fired once. This way each member
   * of the class that should send a reset when it is changed will still only send a single RESET event if a bunch of them
   * are modified together.
   *
   * @private
   */
  scheduleReset_() {
    this.resetTimer_.start();
  }

  /**
   * Updates the current position accounting for any animateRanges_
   *
   * @param {number} dir
   * @private
   */
  adjustCurrent_(dir) {
    var lastCurrent = this.current_;
    var nextFrame = this.getNextFrame(this.current_, dir);
    var nextPosition = dir > 0 && !this.lock_ ? nextFrame.start : nextFrame.end; // only look at end when locking
    if (!this.animateRanges_.isEmpty()) {
      if (!this.animateRanges_.containsValue(nextPosition)) {
        // find the nearest range
        var range = this.findNextNearestRange_(this.animateRanges_, dir, this.current_) || this.getRange();
        if (Range.equals(this.lastRange_, range)) {
          range = this.findNextNearestRange_(this.animateRanges_, dir, nextPosition) || this.getRange();
        }

        if (dir > 0) {
          // align the left edge of the window with the start of the next animation range, minus one skip interval
          this.current_ = this.lock_ ? (range.start - this.skip_) : (range.start + (this.offset_ - this.skip_));
        } else {
          // align the right edge of the window with the end of the previous animation range, plus one skip interval
          this.current_ = range.end + this.skip_;
        }

        var currentFrame = this.getCurrentFrame();
        if (Range.contains(currentFrame, range)) {
          this.current_ = dir > 0 ? range.start : range.end;
        }

        this.lastRange_ = range;

        if (this.lock_) {
          if (this.loadRanges_.getBounds().end === range.end && (this.skip_ + nextPosition -
              this.getAnimationRange().end) > 0) {
            // for last frame only, let it go past end
            this.current_ = lastCurrent;
          } else {
            this.setOffset(this.current_ - nextPosition + this.offset_ + this.skip_ * dir);
          }
        }
      }
    } else {
      var effLoadRangeSet = this.getEffectiveLoadRangeSet();
      if (!effLoadRangeSet.isEmpty() && !effLoadRangeSet.containsValue(nextPosition)) {
        // find the nearest range
        var range = this.findNextNearestRange_(effLoadRangeSet, dir, this.current_) || effLoadRangeSet.getBounds();
        if (Range.equals(this.lastRange_, range)) {
          range = this.findNextNearestRange_(effLoadRangeSet, dir, nextPosition) || effLoadRangeSet.getBounds();
        }

        if (dir > 0) {
          // align the left edge of the window with the start of the next animation range, minus one skip interval
          this.current_ = this.lock_ ? range.start : (range.start + (this.offset_ - this.skip_));
        } else {
          // align the right edge of the window with the end of the previous animation range, plus one skip interval
          this.current_ = range.end + this.skip_;
        }

        var currentFrame = this.getCurrentFrame();
        if (Range.contains(currentFrame, range)) {
          this.current_ = dir > 0 ? range.start : range.end;
        }

        this.lastRange_ = range;

        if (this.lock_) {
          if (this.loadRanges_.getBounds().end === range.end && (this.skip_ + nextPosition - range.end) > 0) {
            // for last frame only, let it go past end
            this.current_ = lastCurrent;
          } else {
            this.setOffset(this.current_ - nextPosition + this.offset_ + this.skip_ * dir);
          }
        }
      }
    }
  }

  /**
   * Returns the next position
   *
   * @param {number} current
   * @param {number} dir
   * @return {number}
   * @private
   */
  getNextPosition_(current, dir) {
    return current + (dir * this.skip_);
  }

  /**
   * Finds the next or previous nearest range in the rangeSet to position
   *
   * @param {RangeSet} rangeSet source range set
   * @param {number} dir if < 0 looks backwards, otherwise forward.
   * @param {number} position
   * @return {?Range} nearest range or null
   * @private
   */
  findNextNearestRange_(rangeSet, dir, position) {
    var range = null;
    var i;
    var r;
    try {
      var ranges = iter.toArray(rangeSet);
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
  }

  /**
   * @param {number} dir ( 1 forward, -1 backward)
   * @private
   */
  step_(dir) {
    this.adjustCurrent_(dir);
    if (this.getLock()) {
      var nextOffset = this.getNextPosition_(this.offset_, dir);
      var nextCurrent = this.getNextPosition_(this.current_, dir);
      this.setCurrent(nextCurrent);
      this.setOffset(nextOffset);
    } else {
      this.setCurrent(this.getNextPosition_(this.current_, dir));
    }
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var obj = opt_to || {};
    obj['start'] = this.getStart();
    obj['end'] = this.getEnd();
    obj['duration'] = this.getDuration();
    obj['current'] = this.getCurrent();
    obj['offset'] = this.getOffset();
    obj['fade'] = this.getFade();
    obj['lock'] = this.getLock();
    obj['skip'] = this.getSkip();
    obj['autoConfig'] = this.getAutoConfigure();
    obj['playing'] = this.isPlaying();
    obj['sliceRanges'] = this.sliceRanges_.clone();
    obj['loadRanges'] = this.loadRanges_.clone();
    obj['animateRanges'] = this.animateRanges_.clone();
    obj['holdRanges'] = this.holdRanges_.clone();

    return obj;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    this.setRange(this.buildRange(config['start'], config['end']));
    this.setDuration(config['duration']);
    this.setOffset(config['offset']);
    this.setFade(config['fade']);
    this.setLock(config['lock']);
    this.setSkip(config['skip']);
    this.setAutoConfigure(config['autoConfig']);
    this.setCurrent(config['current']);
    this.setSliceRanges(config['sliceRanges']);
    this.setLoadRanges(config['loadRanges']);
    this.setAnimateRanges(config['animateRanges']);
    this.setHoldRanges(config['holdRanges']);

    if (config['playing']) {
      this.play();
    } else {
      this.stop();
    }
  }

  /**
   * Updates the current position to the beginning of the animation sequence, and
   * re-computes the step size and offsets based on the current animation range.
   *
   * @private
   */
  updateOffetsAndCurrent_() {
    timeline.setDefaultOffsetForRange(this, this.getSmallestAnimateRangeLength());
  }

  /**
   * Reset the timeline to config state
   *
   * @param {Object} config The state
   */
  reset(config) {
    this.restore(config);
    this.updateOffetsAndCurrent_();
  }

  /**
   * Repositions the current playback position to the start of the
   * timeline animation.
   */
  moveToStart() {
    this.setCurrent(this.getAnimationRange().start);
  }

  /**
   * Repositions the current playback position to the end of the
   * timeline animation.
   */
  moveToEnd() {
    this.setCurrent(this.getAnimationRange().end);
  }

  /**
   * Clears all slices
   */
  clearSliceRanges() {
    if (!this.sliceRanges_.isEmpty()) {
      this.sliceRanges_.clear();
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Adds a slice from a timerange
   *
   * @param {Range} timerange
   */
  addSliceRange(timerange) {
    var cloned = new Range(0, 1); // cloning or making a new range sets start to the lower of start/end
    cloned.start = timerange.start; // manually set start & end
    cloned.end = timerange.end;
    var cleanedRange = this.cleanSliceRange(cloned);
    if (cleanedRange) {
      var tr = this.sliceRanges_.clone();
      if (cleanedRange.start > cleanedRange.end) { // selected across a day, split into 2 ranges
        var range2 = new Range(0, cleanedRange.end);
        this.sliceRanges_.add(range2);
        cleanedRange = new Range(cleanedRange.start, osTime.millisecondsInDay);
      }

      this.sliceRanges_.add(cleanedRange.clone());

      // emit a changed event if the timeline has actually changed.
      if (!RangeSet.equals(tr, this.sliceRanges_)) {
        this.calcRangeCache_.clear();
        this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
        this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
        if (tr.isEmpty() && !this.sliceRanges_.isEmpty()) {
          this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
        }
        this.dispatchShowEvent_();
        this.scheduleReset_();
      }
    }
  }

  /**
   * Adds a slice from a timerange
   *
   * @param {Range} timerange
   * @return {goog.math.Range} timerange
   */
  cleanSliceRange(timerange) {
    if (timerange.end - timerange.start >= osTime.millisecondsInDay) {
      var msg = 'Slice size must be less than a day, setting to largest allowable';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.INFO);
      return new Range(0, osTime.millisecondsInDay);
    } else {
      var tr = new Range(0, 1); // make a safe copy
      tr.start = timerange.start;
      tr.end = timerange.end;
      if (timerange.start > osTime.millisecondsInDay) { // only care about hours, mins, seconds, milliseconds
        tr.start = timerange.start % osTime.millisecondsInDay;
      }
      if (timerange.end > osTime.millisecondsInDay) { // only care about hours, mins, seconds, milliseconds
        tr.end = timerange.end % osTime.millisecondsInDay;
      }
      return tr;
    }
  }

  /**
   * Updates an existing slice timerange
   *
   * @param {Range} newTimerange
   * @param {goog.math.Range} oldTimerange
   * @return {boolean}
   */
  updateSliceRange(newTimerange, oldTimerange) {
    var newRange = this.cleanSliceRange(newTimerange);
    var oldRange = this.cleanSliceRange(oldTimerange);
    if (newRange.start != oldRange.start || newRange.end != oldRange.end) {
      if (oldRange.end >= osTime.millisecondsInDay - 1000) { // timeline snaps the prior second, delete range properly
        oldRange.end = osTime.millisecondsInDay;
      }
      this.sliceRanges_.remove(oldRange);
      this.addSliceRange(newRange);
    }
    return true;
  }

  /**
   * Removes a slice timerange
   *
   * @param {Range} timerange
   */
  removeSliceRange(timerange) {
    var range = this.cleanSliceRange(timerange);
    var tr = this.sliceRanges_.clone();
    if (range.end >= osTime.millisecondsInDay - 1000) { // timeline snaps the prior second, delete range properly
      range.end = osTime.millisecondsInDay;
    }
    this.sliceRanges_.remove(range);

    // emit a changed event if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.sliceRanges_)) {
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      if (!tr.isEmpty() && this.sliceRanges_.isEmpty()) {
        this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
      }
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }

  /**
   * Sets the slice ranges.
   *
   * @param {?RangeSet} ranges
   */
  setSliceRanges(ranges) {
    if (ranges && ranges instanceof RangeSet) {
      var tr = this.sliceRanges_.clone();
      this.sliceRanges_ = ranges.clone();
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      if ((!tr.isEmpty() && this.sliceRanges_.isEmpty()) ||
          (tr.isEmpty() && !this.sliceRanges_.isEmpty())) {
        this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
      }
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }

  /**
   * Returns all slice ranges.
   *
   * @return {!Array<Range>}
   */
  getSliceRanges() {
    return iter.toArray(this.sliceRanges_);
  }

  /**
   * Returns all load ranges with slices.
   *
   * @return {RangeSet}
   */
  getSliceRangeSet() {
    return this.sliceRanges_.clone();
  }

  /**
   * @return {boolean}
   */
  hasSliceRanges() {
    return !this.sliceRanges_.isEmpty();
  }

  /**
   * Returns all load ranges.
   *
   * @return {!Array<Range>}
   */
  getEffectiveSliceRanges() {
    return iter.toArray(this.hasSliceRanges() ? this.getEffectiveLoadRangeSet() : []);
  }

  /**
   * Returns all load ranges.
   *
   * @return {RangeSet}
   */
  getEffectiveLoadRangeSet() {
    var ranges = this.getLoadRangeSet(); // return loaded range if no slices
    if (this.hasSliceRanges()) {
      if (this.calcRangeCache_.isEmpty()) {
        var slicesApplied = new RangeSet();
        var slices = this.getSliceRanges();
        var loadRanges = this.getLoadRanges(); // return loaded range if no slices
        for (var i = 0; i < loadRanges.length; i++) { // for range in loadRanges
          var length = Math.ceil((loadRanges[i].end - loadRanges[i].start) / osTime.millisecondsInDay); // #days in range
          if (loadRanges[i].end % osTime.millisecondsInDay < loadRanges[i].start % osTime.millisecondsInDay + 1) {
            length++; // extra partial day
          }
          var firstDay = loadRanges[i].start - loadRanges[i].start % osTime.millisecondsInDay; // first day of the range
          for (var j = 0; j < length; j++) { // take a slice out of each day
            var day = firstDay + j * osTime.millisecondsInDay; // start time of current day in range
            var dayRange = this.buildRange(day, day + osTime.millisecondsInDay - 1000); // range extending the full day
            var finalRange = Range.intersection(dayRange, loadRanges[i]); // clip  to match first / last day
            for (var k = 0; k < slices.length; k++) { // for slice in slices
              var daySlice = this.buildRange(day + slices[k].start, day + slices[k].end); // add slice to day
              var intersectRangeSet = Range.intersection(daySlice, finalRange);
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
  }

  /**
   * Returns all load ranges.
   *
   * @return {!Array<Range>}
   * @export Prevent the compiler from moving the function off the prototype.
   */
  getEffectiveLoadRanges() {
    return iter.toArray(this.getEffectiveLoadRangeSet());
  }

  /**
   * Clears all load ranges
   *
   * @param {boolean=} opt_loud
   */
  clearLoadRanges(opt_loud) {
    if (!this.loadRanges_.isEmpty()) {
      this.loadRanges_.clear();
      this.calcRangeCache_.clear();
      if (opt_loud) {
        this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
        this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
        this.dispatchShowEvent_();
      }
    }
  }

  /**
   * Adds a load timerange
   *
   * @param {Range} timerange
   */
  addLoadRange(timerange) {
    var tr = this.loadRanges_.clone();
    this.loadRanges_.add(timerange.clone());

    // emit a changed evet if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.loadRanges_)) {
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      var numPrev = iter.toArray(tr).length;
      var numNow = this.getLoadRanges().length;
      if (numPrev === 1 && numNow > 1 || numNow === 1) { // consider when ranges are combined!
        this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
      }
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }

  /**
   * Updates an existing load timerange
   *
   * @param {Range} newTimerange
   * @param {goog.math.Range} oldTimerange
   */
  updateLoadRange(newTimerange, oldTimerange) {
    if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
      this.loadRanges_.remove(oldTimerange.clone());
      this.addLoadRange(newTimerange);
    }
  }

  /**
   * Checks for an existing timerange with a start or end match
   *
   * @param {RangeSet} rangeSet
   * @param {Range} timerange
   * @return {?goog.math.Range}
   */
  hasRange(rangeSet, timerange) {
    return iter.nextOrValue(iter.filter(rangeSet, function(range) {
      return (range.start === timerange.start || range.end === timerange.end);
    }), null);
  }

  /**
   * Checks for an existing timerange with an exact start and end match
   *
   * @param {RangeSet} rangeSet
   * @param {Range} timerange
   * @return {?goog.math.Range}
   */
  hasExactRange(rangeSet, timerange) {
    return iter.nextOrValue(iter.filter(rangeSet, function(range) {
      return (range.start === timerange.start && range.end === timerange.end);
    }), null);
  }

  /**
   * Removes a load timerange
   *
   * @param {Range} timerange
   */
  removeLoadRange(timerange) {
    var tr = this.loadRanges_.clone();
    this.loadRanges_.remove(timerange);
    if (!this.loadRanges_.isEmpty()) {
      if (!RangeSet.equals(tr, this.loadRanges_)) { // emit a changed evet if the timeline has actually changed.
        this.calcRangeCache_.clear();
        this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
        this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
        var numPrev = iter.toArray(tr).length;
        var numNow = this.getLoadRanges().length;
        if (numPrev > 1 && numNow === 1) {
          this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
        }
        this.dispatchShowEvent_();
        this.scheduleReset_();
      }
    } else { // this shouldn't happen, but if it does
      this.loadRanges_.remove(timerange); // add it back to the UI
      this.loadRanges_.add(timerange.clone());
      var msg = 'At least one load range must always be present';
      AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.INFO);
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }

  /**
   * Sets the load ranges.
   *
   * @param {?RangeSet} ranges
   */
  setLoadRanges(ranges) {
    if (ranges && ranges instanceof RangeSet) {
      var numPrev = this.getLoadRanges().length;
      var numNow = iter.toArray(ranges).length;
      if ((numPrev === 1 && numNow != 1) || (numPrev > 1 && numNow === 1)) {
        this.dispatchEvent(TimelineEventType.REFRESH_LOAD);
      }
      this.loadRanges_ = ranges.clone();
      this.calcRangeCache_.clear();
      this.dispatchEvent(TimelineEventType.SLICE_RANGE_CHANGED);
      this.dispatchEvent(TimelineEventType.RANGE_CHANGED);
      this.dispatchShowEvent_();
      this.scheduleReset_();
    }
  }

  /**
   * Returns all load ranges.
   *
   * @return {!Array<Range>}
   */
  getLoadRanges() {
    return iter.toArray(this.loadRanges_);
  }

  /**
   * Returns all load ranges.
   *
   * @return {RangeSet}
   */
  getLoadRangeSet() {
    return this.loadRanges_.clone();
  }

  /**
   * Clears all animate ranges
   */
  clearAnimateRanges() {
    if (!this.animateRanges_.isEmpty()) {
      this.animateRanges_.clear();
      this.dispatchEvent(TimelineEventType.ANIMATE_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Adds a timerange
   *
   * @param {Range} timerange
   */
  addAnimateRange(timerange) {
    var tr = this.animateRanges_.clone();
    this.animateRanges_.add(timerange.clone());

    // emit a changed evet if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.animateRanges_)) {
      this.dispatchEvent(TimelineEventType.ANIMATE_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Updates an existing timerange
   *
   * @param {Range} newTimerange
   * @param {goog.math.Range} oldTimerange
   */
  updateAnimateRange(newTimerange, oldTimerange) {
    if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
      this.animateRanges_.remove(oldTimerange);
      this.addAnimateRange(newTimerange);
      if (this.getLock()) {
        this.setCurrent(this.getAnimationRange().start + this.getOffset());
      }
    }
  }

  /**
   * Removes a timerange
   *
   * @param {Range} timerange
   */
  removeAnimateRange(timerange) {
    var tr = this.animateRanges_.clone();
    this.animateRanges_.remove(timerange);

    // emit a changed event if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.animateRanges_)) {
      this.dispatchEvent(TimelineEventType.ANIMATE_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Sets the animation ranges.
   *
   * @param {?RangeSet} ranges
   */
  setAnimateRanges(ranges) {
    if (ranges && ranges instanceof RangeSet) {
      this.animateRanges_ = ranges.clone();
      this.dispatchEvent(TimelineEventType.ANIMATE_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Returns all animation ranges.
   *
   * @return {!Array<Range>}
   */
  getAnimationRanges() {
    return iter.toArray(this.animateRanges_);
  }

  /**
   * @return {boolean}
   */
  hasAnimationRanges() {
    return !this.animateRanges_.isEmpty();
  }

  /**
   * @return {boolean}
   */
  hasHoldRanges() {
    return !this.holdRanges_.isEmpty();
  }

  /**
   * Returns all hold ranges.
   *
   * @return {!Array<Range>}
   */
  getHoldRanges() {
    return iter.toArray(this.holdRanges_);
  }

  /**
   * Sets the hold ranges.
   *
   * @param {?RangeSet} ranges
   */
  setHoldRanges(ranges) {
    if (ranges && ranges instanceof RangeSet) {
      this.holdRanges_ = ranges.clone();
      this.dispatchEvent(TimelineEventType.HOLD_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Removes a hold range
   *
   * @param {Range} timerange
   */
  removeHoldRange(timerange) {
    var tr = this.holdRanges_.clone();

    this.holdRanges_.remove(timerange);

    // emit a changed evet if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.holdRanges_)) {
      this.dispatchEvent(TimelineEventType.HOLD_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Clears all hold ranges
   */
  clearHoldRanges() {
    if (!this.holdRanges_.isEmpty()) {
      this.holdRanges_.clear();
      this.dispatchEvent(TimelineEventType.HOLD_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Adds a hold timerange
   *
   * @param {Range} timerange
   */
  addHoldRange(timerange) {
    var tr = this.holdRanges_.clone();
    this.holdRanges_.add(timerange.clone());

    // emit a changed evet if the timeline has actually changed.
    if (!RangeSet.equals(tr, this.holdRanges_)) {
      this.dispatchEvent(TimelineEventType.HOLD_RANGE_CHANGED);
      this.dispatchShowEvent_();
    }
  }

  /**
   * Updates an existing hold timerange
   *
   * @param {Range} newTimerange
   * @param {goog.math.Range} oldTimerange
   */
  updateHoldRange(newTimerange, oldTimerange) {
    if (newTimerange.start != oldTimerange.start || newTimerange.end != oldTimerange.end) {
      this.holdRanges_.remove(oldTimerange);
      this.addHoldRange(newTimerange);
    }
  }

  /**
   * Returns true if the hold ranges contain the range
   *
   * @param {Range} timerange
   * @return {boolean}
   */
  holdRangeContains(timerange) {
    return this.holdRanges_.contains(timerange);
  }

  /**
   * Returns true if the hold ranges contain the time
   *
   * @param {?os.time.ITime} time
   * @return {boolean}
   */
  holdRangeContainsTime(time) {
    if (time && !this.holdRanges_.isEmpty()) {
      if (time.getStart() === time.getEnd()) {
        return this.holdRanges_.containsValue(time.getStart());
      } else {
        return this.holdRangeContains(new Range(time.getStart(), time.getEnd()));
      }
    }
    return false;
  }

  /**
   * Get the global instance.
   * @return {!TimelineController}
   */
  static getInstance() {
    if (!instance) {
      instance = new TimelineController();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {TimelineController} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {TimelineController|undefined}
 */
let instance;

exports = TimelineController;
