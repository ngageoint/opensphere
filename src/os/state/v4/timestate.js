goog.module('os.state.v4.TimeState');

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const {getElementByClass} = goog.require('goog.dom');
const log = goog.require('goog.log');
const Range = goog.require('goog.math.Range');
const RangeSet = goog.require('goog.math.RangeSet');
const dispatcher = goog.require('os.Dispatcher');
const XMLState = goog.require('os.state.XMLState');
const TimeTag = goog.require('os.state.v4.TimeTag');
const {isRelativeDuration, momentFormat, parseMoment} = goog.require('os.time');
const Duration = goog.require('os.time.Duration');
const {autoConfigureFromTimeRange, setDefaultOffsetForRange} = goog.require('os.time.timeline');
const TimeRange = goog.require('os.time.TimeRange');
const TimelineController = goog.require('os.time.TimelineController');
const {default: UIEvent} = goog.require('os.ui.events.UIEvent');
const {default: UIEventType} = goog.require('os.ui.events.UIEventType');
const {default: AbstractTimelineCtrl} = goog.require('os.ui.timeline.AbstractTimelineCtrl');
const {appendElement, createElement} = goog.require('os.xml');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
class TimeState extends XMLState {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.description = 'Saves the current timeline';
    this.priority = 100;
    this.rootName = TimeTag.TIME;
    this.title = 'Time';
  }

  /**
   * @inheritDoc
   */
  load(obj, id) {
    obj = XMLState.ensureXML(obj);

    if (!(obj instanceof Element)) {
      log.error(logger, 'Unable to load state content!');
      return;
    }

    try {
      if (!TimeState.testUIState(obj)) {
        var animationEl = obj.querySelector(TimeTag.ANIMATION);
        var tActive = animationEl != null && animationEl.childElementCount > 0;

        // toggle the timeline to the appropriate state
        var event = new UIEvent(UIEventType.TOGGLE_UI, 'timeline', tActive);
        dispatcher.getInstance().dispatchEvent(event);

        // wait for the UI to open/close before configuring the timeline
        var loadDelay = new ConditionalDelay(TimeState.testUIState.bind(undefined, obj));
        var loadFn = this.loadInternal.bind(this, obj, id);
        loadDelay.onSuccess = loadFn;
        loadDelay.onFailure = loadFn;
        loadDelay.start(100, 5000);
      } else {
        // in the correct state, so load immediately
        this.loadInternal(obj, id);
      }
    } catch (e) {
      log.error(logger, 'Failed to parse time state! Stack: ' + e.stack);
    }
  }

  /**
   * Load the timeline state.
   *
   * @param {!Element} obj The state element.
   * @param {string} id The state ID.
   * @protected
   */
  loadInternal(obj, id) {
    try {
      var animationEl = obj.querySelector(TimeTag.ANIMATION);
      var tActive = animationEl != null && animationEl.childElementCount > 0;
      var tlc = TimelineController.getInstance();

      var loadRanges = this.readIntervalsAsRangeSet_(obj, TimeTag.LOAD_INTERVALS);
      var fullLoadRange = this.readRangeFromIntervals_(obj);
      var current = this.readCurrent_(obj);

      // Desktop may only provide a current tag if the Time state is exported, but not the Animation state. in that
      // case, treat current as the loaded range.
      if (!fullLoadRange && current) {
        fullLoadRange = new Range(current.start, current.end);
      }

      if (fullLoadRange) {
        // set the duration first since doing so will clear animate/hold ranges
        var duration = this.readDuration_(obj, fullLoadRange) || undefined;
        if (duration) {
          tlc.setDuration(duration);
        }

        var animateRanges = this.readIntervalsAsRangeSet_(obj, TimeTag.PLAY_INTERVALS);
        var fullLoadRangeSet = loadRanges.isEmpty() ? new RangeSet() : loadRanges;

        if (fullLoadRangeSet.isEmpty()) {
          // backwards compatibility: if the LOAD_INTERVALS tag wasn't present, simply use the fullLoadRange
          fullLoadRangeSet.add(fullLoadRange);
        }

        // if the animate range is equal to the loaded range, clear out the animate ranges
        tlc.setLoadRanges(fullLoadRangeSet);

        // make sure we have good defaults when the timeline is open. this changes the timeline controller duration to the
        // value used for tile ranges with the timeline open, so we don't want it called if the timeline is closed.
        if (tActive) {
          autoConfigureFromTimeRange(tlc, duration);
          setDefaultOffsetForRange(tlc, fullLoadRange.end - fullLoadRange.start);
        }

        if (RangeSet.equals(fullLoadRangeSet, animateRanges)) {
          tlc.clearAnimateRanges();
        } else {
          tlc.setAnimateRanges(animateRanges);
        }

        tlc.setHoldRanges(this.readIntervalsAsRangeSet_(obj, TimeTag.HOLDS));
        tlc.setSliceRanges(this.readSlicesAsRangeSet_(obj));
      }

      // set the active window position. this needs to be called after auto configure, or these values will be overridden.
      if (current) {
        tlc.setOffset(current.end - current.start);
        tlc.setCurrent(current.end);
      }

      // set the frame rate
      var fps = this.readFps_(obj);
      if (fps !== null) {
        tlc.setFps(fps);
      }

      // set the active window skip interval
      var skip = this.readSkip_(obj);
      if (skip !== null && skip !== 0) {
        tlc.setSkip(skip);
      }

      var autoConfigure = this.readBoolean_(TimeTag.AUTO_CONFIGURE, obj);
      if (autoConfigure !== null) {
        tlc.setAutoConfigure(autoConfigure);
      }

      var lock = this.readLock_(obj);
      if (lock !== null) {
        tlc.setLock(lock);
      }

      var lockRange = this.readRange_(TimeTag.LOCK_RANGE, obj);
      if (lockRange !== null) {
        tlc.setLockRange(lockRange.end - lockRange.start);
      }

      var fade = this.readFade_(obj);
      if (fade !== null) {
        tlc.setFade(fade);
      }

      // force the date control to update from the timeline controller
      var dcScope = angular.element('.js-date-control').scope();
      if (dcScope) {
        dcScope['dateControl'].update();
      }

      if (tActive) {
        // force the timeline panel to update from the timeline controller
        var tlContainer = getElementByClass('js-timeline');
        if (tlContainer) {
          var tlCtrl = angular.element(tlContainer).scope()['timelineCtrl'];
          if (tlCtrl && animationEl) {
            var collapsed = this.readBoolean_(TimeTag.COLLAPSED, animationEl);
            if (collapsed != null) {
              tlCtrl.setCollapsed(collapsed);
            }

            var timeRange = this.readVisibleRange_(animationEl);
            if (timeRange != null) {
              angular.element(tlContainer).children().scope()['timeline'].setVisibleRange(timeRange);
            }
          } else {
            tlCtrl.updateTimeline(true);
          }
        }

        var stateEl = animationEl.querySelector(TimeTag.PLAY_STATE);
        if (stateEl && stateEl.textContent == 'Play') {
          // start animation if explicity set to do so
          tlc.play();
        } else if (tlc.isPlaying()) {
          // otherwise stop animation
          tlc.stop();
        }
      }
    } catch (e) {
      log.error(logger, 'Failed to parse time state! Stack: ' + e.stack);
    }
  }

  /**
   * @inheritDoc
   */
  remove(id) {
    // do nothing
  }

  /**
   * @inheritDoc
   */
  saveInternal(options, rootObj) {
    try {
      var tlc = TimelineController.getInstance();

      var loadRange = tlc.getLoadRange();
      var currentStart = tlc.getCurrent() - tlc.getOffset();
      var currentRange = tlc.getCurrentRange();
      var advance = moment.duration(tlc.getSkip()).toISOString();
      if (tlc.getLock()) {
        // if the lock is used, save the lock range off
        var lockRange = new Range(currentStart, currentStart + tlc.getLockRange());
        appendElement(TimeTag.LOCK_RANGE, rootObj,
            this.rangeToDateFormatString_(lockRange));
      }

      // Set the load range, current range, and advance.
      appendElement(TimeTag.INTERVAL, rootObj, this.rangeToDateFormatString_(loadRange));
      appendElement(TimeTag.CURRENT, rootObj, this.rangeToDateFormatString_(currentRange));
      appendElement(TimeTag.ADVANCE, rootObj, advance);

      var loadRanges = tlc.getLoadRanges();
      if (loadRanges && loadRanges.length > 1) {
        // more than one load range, so add all of them, but leave the old INTERVAL tag for backwards compatibility
        var loadSeq = /** @type {!Element} */ (appendElement(TimeTag.LOAD_INTERVALS, rootObj));
        this.addRanges_(loadRanges, loadSeq);
      }

      if (tlc.hasAnimationRanges()) {
        // NOTE: Using the sequence element for animation ranges. As of 08/24/2016
        // Desktop was not using this element.
        var sequence = /** @type {!Element} */ (appendElement(TimeTag.PLAY_INTERVALS, rootObj));
        this.addRanges_(tlc.getAnimationRanges(), sequence);
      }

      if (tlc.hasHoldRanges()) {
        // NOTE: v4 heldIntervals can include an optional key element
        // which should be associated with a specific layer. Currently,
        // we do not support this feature, so the following
        // just reads all the interval elements.
        rootObj.appendChild(this.holdRangeToXml_(tlc.getHoldRanges()));
      }

      if (this.isTimeLineVisible()) {
        var millisPerFrame = Math.floor(Math.round(1000 / tlc.getFps()));
        var playState = tlc.isPlaying() ? 'Play' : 'Stop';

        var animation = appendElement(TimeTag.ANIMATION, rootObj);
        appendElement(TimeTag.MS_PER_FRAME, animation, millisPerFrame);
        appendElement(TimeTag.PLAY_STATE, animation, playState);

        var tlContainer = getElementByClass('js-timeline');
        if (tlContainer) {
          appendElement(TimeTag.COLLAPSED, animation, AbstractTimelineCtrl.collapsed);
          var visibleRange = angular.element(tlContainer).children().scope()['timeline'].getVisibleRange();
          appendElement(TimeTag.VISIBLE_RANGE, animation,
              this.rangeToDateFormatString_(new Range(visibleRange.getStart(), visibleRange.getEnd())));
        }
      }

      var fade = moment.duration(tlc.getFade() ? tlc.getOffset() : 0).toISOString();
      var fadeEl = appendElement(TimeTag.FADE, rootObj);
      appendElement('in', fadeEl, fade);
      appendElement('out', fadeEl, fade);

      if (tlc.hasSliceRanges()) {
        rootObj.appendChild(this.sliceRangesToXml_(tlc.getSliceRanges()));
      }

      // if the duration is relative, make sure the saved state reflects the exact time saved and is not relative itself
      var duration = isRelativeDuration(tlc.getDuration()) ? Duration.CUSTOM : tlc.getDuration();

      appendElement(TimeTag.DURATION, rootObj, duration);
      appendElement(TimeTag.LOCK, rootObj, tlc.getLock());
      appendElement(TimeTag.AUTO_CONFIGURE, rootObj, tlc.getAutoConfigure());

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
  }

  /**
   * Returns true if the timeline is currently visible in the ui.
   *
   * @return {boolean}
   */
  isTimeLineVisible() {
    var timeline = getElementByClass('js-timeline');
    return timeline != null;
  }

  /**
   * Returns heldIntervals element for timeranges.
   * NOTE: v4 heldIntervals can include an optional key element
   * which should be associated with a specific layer. Currently,
   * we do not support this feature, so it is not included.
   *
   * @param {Array<Range>} timeranges
   * @return {!Element}
   * @private
   */
  holdRangeToXml_(timeranges) {
    var element = createElement(TimeTag.HOLDS);
    var dateString;
    var range;
    var held;

    for (var i = 0; i < timeranges.length; i = i + 1) {
      held = createElement(TimeTag.HOLD_ITEM);
      element.appendChild(held);
      range = timeranges[i];
      dateString = this.rangeToDateFormatString_(range);
      appendElement(TimeTag.SEQ_INTERVAL, held, dateString);
    }

    return element;
  }

  /**
   * Adds interval elements to the container for each range in timeranges
   *
   * @param {Array<Range>} timeranges
   * @param {!Element} container
   * @private
   */
  addRanges_(timeranges, container) {
    var dateString;
    var range;

    for (var i = 0; i < timeranges.length; i = i + 1) {
      range = timeranges[i];
      dateString = this.rangeToDateFormatString_(range);
      appendElement(TimeTag.SEQ_INTERVAL, container, dateString);
    }
  }

  /**
   * Returns formatted date string for a range.
   *
   * @param {Range} range [description]
   * @return {string}
   * @private
   */
  rangeToDateFormatString_(range) {
    var startDate = new Date(range.start);
    var endDate = new Date(range.end);
    return momentFormat(startDate, TimeState.DATE_FORMAT, true) +
        '/' + momentFormat(endDate, TimeState.DATE_FORMAT, true);
  }

  /**
   * Returns a range for a given interval string value
   *
   * @param {string} interval
   * @return {Range}
   * @private
   */
  intervalStringToRange_(interval) {
    var parts = interval.split(/\//);
    var startDate = parseMoment(parts[0], [TimeState.DATE_FORMAT], true);
    var endDate = parseMoment(parts[1], [TimeState.DATE_FORMAT], true);
    return new Range(startDate.valueOf(), endDate.valueOf());
  }

  /**
   * Reads the full time line range from the element
   *
   * @param {!Element} element
   * @return {Range}
   * @private
   */
  readRangeFromIntervals_(element) {
    var range = null;

    // Create range from all interval elements, as desktop does not include a root interval.
    var intervalElements = element.querySelectorAll(TimeTag.INTERVAL);
    if (intervalElements.length > 0) {
      var result = new RangeSet();

      for (var i = 0; i < intervalElements.length; i = i + 1) {
        var interval = intervalElements[i].textContent;
        result.add(this.intervalStringToRange_(interval));
      }

      range = result.getBounds();
    }

    return range;
  }

  /**
   * Reads the duration from the element, or computes on
   * using the range.
   *
   * @param {!Element} element
   * @param {!Range} range
   * @return {string}
   * @private
   */
  readDuration_(element, range) {
    var durationElement = element.querySelector(TimeTag.DURATION);
    if (durationElement) {
      return durationElement.textContent;
    }
    // Desktop state files do not have a duration, use the range to determine.
    return this.getDurationFromDiff(range.end - range.start);
  }

  /**
   * Reads a collection of intervals and returns a RangeSet
   *
   * @param {!Element} element
   * @param {string} tag
   * @return {RangeSet}
   * @private
   */
  readIntervalsAsRangeSet_(element, tag) {
    var rangeSet = new RangeSet();
    if (element) {
      var parentElement = element.querySelector(tag);
      if (parentElement) {
        var intervals = parentElement.querySelectorAll(TimeTag.INTERVAL);
        for (var i = 0; i < intervals.length; i = i + 1) {
          rangeSet.add(this.intervalStringToRange_(intervals[i].textContent));
        }
      }
    }
    return rangeSet;
  }

  /**
   * Get the duration represented by a time difference and optional number of intervals.
   *
   * @param {number} diff The time difference
   * @param {number=} opt_numIntervals The number of time intervals
   * @return {string} The duration
   * @protected
   */
  getDurationFromDiff(diff, opt_numIntervals) {
    var numIntervals = opt_numIntervals !== undefined ? opt_numIntervals : 1;
    var val = null;

    if (diff >= 28 * 24 * 60 * 60 * 1000) {
      val = Duration.MONTH;
    } else if (numIntervals > 1 && diff >= 7 * 24 * 60 * 60 * 1000) {
      val = Duration.WEEK;
    } else if (numIntervals < 2 && diff == 7 * 24 * 60 * 60 * 1000) {
      val = Duration.WEEK;
    } else if (diff == 24 * 60 * 60 * 1000) {
      val = Duration.DAY;
    } else {
      val = Duration.CUSTOM;
    }

    return val;
  }

  /**
   * Reads the fps element.
   *
   * @param {!Element} element
   * @return {?number}
   * @private
   */
  readFps_(element) {
    var result = 0;
    var msPerFrameEl = element.querySelector(TimeTag.MS_PER_FRAME);
    var msPerFrame = msPerFrameEl ? Number(msPerFrameEl.textContent) : 0;
    if (!isNaN(msPerFrame) && msPerFrame > 0) {
      result = Math.round(1000 / msPerFrame);
    }
    if (isNaN(result) || result === 0) {
      return null;
    }
    return result;
  }

  /**
   * Reads the current element.
   *
   * @param {!Element} element
   * @return {Range}
   * @private
   */
  readCurrent_(element) {
    return this.readRange_(TimeTag.CURRENT, element);
  }

  /**
   * Reads a range element.
   *
   * @param {!string} tag
   * @param {!Element} element
   * @return {Range}
   * @private
   */
  readRange_(tag, element) {
    var rangeEl = element.querySelector(tag);
    var range = rangeEl ? rangeEl.textContent : undefined;
    if (range) {
      return this.intervalStringToRange_(range);
    }
    return null;
  }

  /**
   * Reads the visible range element.
   *
   * @param {!Element} element
   * @return {TimeRange}
   * @private
   */
  readVisibleRange_(element) {
    var currentEl = element.querySelector(TimeTag.VISIBLE_RANGE);
    var visibleRange = currentEl ? currentEl.textContent : undefined;
    if (visibleRange) {
      var range = this.intervalStringToRange_(visibleRange);
      return new TimeRange(range.start, range.end);
    }
    return null;
  }

  /**
   * Reads the skip element.
   * @param {!Element} element
   * @return {?number}
   * @private
   */
  readSkip_(element) {
    var skipEl = element.querySelector(TimeTag.ADVANCE);
    if (skipEl) {
      return moment.duration(skipEl.textContent).asMilliseconds();
    }
    return null;
  }

  /**
   * Reads the lock element.
   * @param {!Element} element
   * @return {?boolean}
   * @private
   */
  readLock_(element) {
    return this.readBoolean_(TimeTag.LOCK, element);
  }

  /**
   * Reads the fade element.
   * @param {!Element} element
   * @return {?boolean}
   * @private
   */
  readFade_(element) {
    var fadeEl = element.querySelector(TimeTag.FADE);
    if (fadeEl) {
      var fadeIn = 0;
      var fadeOut = 0;

      var fadeInEl = fadeEl.querySelector('in');
      if (fadeInEl) {
        fadeIn = moment.duration(fadeInEl.textContent).asMilliseconds();
      }

      var fadeOutEl = fadeEl.querySelector('out');
      if (fadeOutEl) {
        fadeOut = moment.duration(fadeOutEl.textContent).asMilliseconds();
      }

      if (fadeIn != 0 || fadeOut != 0) {
        return true;
      }
      return false;
    }
    return null;
  }

  /**
   * Reads a boolean element.
   * @param {!string} tag
   * @param {!Element} element
   * @return {?boolean}
   * @private
   */
  readBoolean_(tag, element) {
    var booleanElement = element.querySelector(tag);
    if (booleanElement) {
      return booleanElement.textContent == 'true';
    }
    return null;
  }

  /**
   * Parse a time period into its component times.
   *
   * @param {string} period The period as "start/end"
   * @return {Array.<number>} The times represented by the period
   * @protected
   */
  parsePeriod(period) {
    if (period) {
      var parts = period.split(/\//);
      if (parts.length > 1) {
        return [new Date(parts[0]).getTime(), new Date(parts[1]).getTime()];
      }
    }

    return null;
  }

  /**
   * Returns slice intervals element for timeranges.
   *
   * @param {Array<Range>} sliceRanges
   * @return {!Element}
   * @private
   */
  sliceRangesToXml_(sliceRanges) {
    var slices = createElement(TimeTag.SLICES);

    for (var i = 0; i < sliceRanges.length; i++) {
      var slice = createElement(TimeTag.SLICE);
      slices.appendChild(slice);
      var interval = createElement(TimeTag.SLICE_INTERVAL);
      slice.appendChild(interval);
      var range = sliceRanges[i];
      appendElement(TimeTag.INTERVAL_START, interval, range.start);
      appendElement(TimeTag.INTERVAL_END, interval, range.end);
    }
    return slices;
  }

  /**
   * Reads a collection of slices and returns a RangeSet
   *
   * @param {!Element} element
   * @return {RangeSet}
   * @private
   */
  readSlicesAsRangeSet_(element) {
    var rangeSet = new RangeSet();
    if (element) {
      var slicesElement = element.querySelector(TimeTag.SLICES);
      if (slicesElement) {
        var intervals = slicesElement.querySelectorAll(TimeTag.SLICE_INTERVAL);
        for (var i = 0; i < intervals.length; i = i + 1) {
          var interval = intervals[i];
          rangeSet.add(this.sliceIntervalToRange_(interval));
        }
      }
    }
    return rangeSet;
  }

  /**
   * Returns a range for a given slice interval
   *
   * @param {!Element} interval
   * @return {Range}
   * @private
   */
  sliceIntervalToRange_(interval) {
    var intervalStart = +interval.querySelector(TimeTag.INTERVAL_START).textContent;
    var intervalEnd = +interval.querySelector(TimeTag.INTERVAL_END).textContent;
    return new Range(intervalStart, intervalEnd);
  }

  /**
   * Test if the timeline UI state is correct for the state object.
   *
   * @param {!Element} obj The state element.
   * @return {boolean} If the UI state is correct.
   */
  static testUIState(obj) {
    var animationEl = obj.querySelector(TimeTag.ANIMATION);
    var tActive = animationEl != null && animationEl.childElementCount > 0;
    var curActive = getElementByClass('js-timeline') != null;
    return tActive === curActive;
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('os.state.v4.TimeState');

/**
 * Time format string.
 * @const
 */
TimeState.DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]';

exports = TimeState;
