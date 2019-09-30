goog.provide('os.state.v4.TimeState');
goog.provide('os.state.v4.TimeTag');

goog.require('goog.asserts');
goog.require('goog.async.ConditionalDelay');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.math.Range');
goog.require('goog.math.RangeSet');
goog.require('os.map');
goog.require('os.state.XMLState');
goog.require('os.time');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.ui.events.UIEvent');
goog.require('os.ui.events.UIEventType');
goog.require('os.xml');


/**
 * XML tags for time state
 * @enum {string}
 */
os.state.v4.TimeTag = {
  ADVANCE: 'advance',
  ANIMATION: 'animation',
  CURRENT: 'current',
  DURATION: 'duration',
  INTERVAL: 'interval',
  LOOP: 'loop', // NOT USING ?
  LOOP_BEHAVIOR: 'loopBehavior', // NOT USING ?
  MS_PER_FRAME: 'millisPerFrame',
  OUT: 'out',
  PLAY_STATE: 'playState',
  PLAY_INTERVALS: 'playIntervals',
  HOLDS: 'heldIntervals',
  HOLD_ITEM: 'held',
  SEQ_INTERVAL: 'interval',
  TIME: 'time',
  SLICES: 'slices',
  SLICE: 'slice',
  SLICE_INTERVAL: 'sliceInterval',
  INTERVAL_START: 'intervalStart',
  INTERVAL_END: 'intervalEnd',
  LOCK: 'lock',
  LOCK_RANGE: 'lockRange',
  FADE: 'fade',
  AUTO_CONFIGURE: 'autoConfigure',
  COLLAPSED: 'timelineCollapsed',
  VISIBLE_RANGE: 'visibleRange'
};


/**
 * @extends {os.state.XMLState}
 * @constructor
 */
os.state.v4.TimeState = function() {
  os.state.v4.TimeState.base(this, 'constructor');
  this.description = 'Saves the current timeline';
  this.priority = 100;
  this.rootName = os.state.v4.TimeTag.TIME;
  this.title = 'Time';
};
goog.inherits(os.state.v4.TimeState, os.state.XMLState);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.state.v4.TimeState.LOGGER_ = goog.log.getLogger('os.state.v4.TimeState');


/**
 * Time format string.
 * @const
 */
os.state.v4.TimeState.DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]';


/**
 * @inheritDoc
 */
os.state.v4.TimeState.prototype.load = function(obj, id) {
  obj = os.state.XMLState.ensureXML(obj);

  if (!(obj instanceof Element)) {
    goog.log.error(os.state.v4.TimeState.LOGGER_, 'Unable to load state content!');
    return;
  }

  try {
    if (!os.state.v4.TimeState.testUIState(obj)) {
      var animationEl = obj.querySelector(os.state.v4.TimeTag.ANIMATION);
      var tActive = animationEl != null && animationEl.childElementCount > 0;

      // toggle the timeline to the appropriate state
      var event = new os.ui.events.UIEvent(os.ui.events.UIEventType.TOGGLE_UI, 'timeline', tActive);
      os.dispatcher.dispatchEvent(event);

      // wait for the UI to open/close before configuring the timeline
      var loadDelay = new goog.async.ConditionalDelay(os.state.v4.TimeState.testUIState.bind(undefined, obj));
      var loadFn = this.loadInternal.bind(this, obj, id);
      loadDelay.onSuccess = loadFn;
      loadDelay.onFailure = loadFn;
      loadDelay.start(100, 5000);
    } else {
      // in the correct state, so load immediately
      this.loadInternal(obj, id);
    }
  } catch (e) {
    goog.log.error(os.state.v4.TimeState.LOGGER_, 'Failed to parse time state! Stack: ' + e.stack);
  }
};


/**
 * Test if the timeline UI state is correct for the state object.
 *
 * @param {!Element} obj The state element.
 * @return {boolean} If the UI state is correct.
 */
os.state.v4.TimeState.testUIState = function(obj) {
  var animationEl = obj.querySelector(os.state.v4.TimeTag.ANIMATION);
  var tActive = animationEl != null && animationEl.childElementCount > 0;
  var curActive = goog.dom.getElementByClass('js-timeline') != null;
  return tActive === curActive;
};


/**
 * Load the timeline state.
 *
 * @param {!Element} obj The state element.
 * @param {string} id The state ID.
 * @protected
 */
os.state.v4.TimeState.prototype.loadInternal = function(obj, id) {
  try {
    var animationEl = obj.querySelector(os.state.v4.TimeTag.ANIMATION);
    var tActive = animationEl != null && animationEl.childElementCount > 0;

    var tlc = os.time.TimelineController.getInstance();
    var fullTimeLineRange = this.readRangeFromIntervals_(obj);
    var current = this.readCurrent_(obj);

    // Desktop may only provide a current tag if the Time state is exported, but not the Animation state. in that
    // case, treat current as the loaded range.
    if (!fullTimeLineRange && current) {
      fullTimeLineRange = new goog.math.Range(current.start, current.end);
    }

    if (fullTimeLineRange) {
      // set the duration first since doing so will clear animate/hold ranges
      var duration = this.readDuration_(obj, fullTimeLineRange) || undefined;
      if (duration) {
        tlc.setDuration(duration);
      }

      var animateRanges = this.readIntervalsAsRangeSet_(obj, os.state.v4.TimeTag.PLAY_INTERVALS);
      var fullRangeSet = new goog.math.RangeSet();
      fullRangeSet.add(fullTimeLineRange);

      // if the animate range is equal to the loaded range, clear out the animate ranges
      tlc.setRange(fullTimeLineRange);

      // make sure we have good defaults when the timeline is open. this changes the timeline controller duration to the
      // value used for tile ranges with the timeline open, so we don't want it called if the timeline is closed.
      if (tActive) {
        os.time.timeline.autoConfigureFromTimeRange(tlc, duration);
        os.time.timeline.setDefaultOffsetForRange(tlc, fullTimeLineRange.end - fullTimeLineRange.start);
      }

      if (goog.math.RangeSet.equals(fullRangeSet, animateRanges)) {
        tlc.clearAnimateRanges();
      } else {
        tlc.setAnimateRanges(animateRanges);
      }

      tlc.setHoldRanges(this.readIntervalsAsRangeSet_(obj, os.state.v4.TimeTag.HOLDS));
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

    var autoConfigure = this.readBoolean_(os.state.v4.TimeTag.AUTO_CONFIGURE, obj);
    if (autoConfigure !== null) {
      tlc.setAutoConfigure(autoConfigure);
    }

    var lock = this.readLock_(obj);
    if (lock !== null) {
      tlc.setLock(lock);
    }

    var lockRange = this.readRange_(os.state.v4.TimeTag.LOCK_RANGE, obj);
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
      var tlContainer = goog.dom.getElementByClass('js-timeline');
      if (tlContainer) {
        var tlCtrl = angular.element(tlContainer).scope()['timelineCtrl'];
        if (tlCtrl && animationEl) {
          var collapsed = this.readBoolean_(os.state.v4.TimeTag.COLLAPSED, animationEl);
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

      var stateEl = animationEl.querySelector(os.state.v4.TimeTag.PLAY_STATE);
      if (stateEl && stateEl.textContent == 'Play') {
        // start animation if explicity set to do so
        tlc.play();
      } else if (tlc.isPlaying()) {
        // otherwise stop animation
        tlc.stop();
      }
    }
  } catch (e) {
    goog.log.error(os.state.v4.TimeState.LOGGER_, 'Failed to parse time state! Stack: ' + e.stack);
  }
};


/**
 * @inheritDoc
 */
os.state.v4.TimeState.prototype.remove = function(id) {
  // do nothing
};


/**
 * @inheritDoc
 */
os.state.v4.TimeState.prototype.saveInternal = function(options, rootObj) {
  try {
    var tlc = os.time.TimelineController.getInstance();

    var currentStart = tlc.getCurrent() - tlc.getOffset();
    var currentRange = new goog.math.Range(currentStart, tlc.getCurrent());
    var advance = moment.duration(tlc.getSkip()).toISOString();
    if (tlc.getLock()) {
      // if the lock is used, save the lock range off
      var lockRange = new goog.math.Range(currentStart, currentStart + tlc.getLockRange());
      os.xml.appendElement(os.state.v4.TimeTag.LOCK_RANGE, rootObj,
          this.rangeToDateFormatString_(lockRange));
    }

    // Root level interval is the full animation range.
    os.xml.appendElement(os.state.v4.TimeTag.INTERVAL, rootObj,
        this.rangeToDateFormatString_(tlc.getRange()));
    os.xml.appendElement(os.state.v4.TimeTag.CURRENT, rootObj,
        this.rangeToDateFormatString_(currentRange));
    os.xml.appendElement(os.state.v4.TimeTag.ADVANCE, rootObj, advance);

    if (tlc.hasAnimationRanges()) {
      // NOTE: Using the sequence element for animation ranges. As of 08/24/2016
      // Desktop was not using this element.
      var sequence = /** @type {!Element} */ (os.xml.appendElement(os.state.v4.TimeTag.PLAY_INTERVALS, rootObj));
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

      var animation = os.xml.appendElement(os.state.v4.TimeTag.ANIMATION, rootObj);
      os.xml.appendElement(os.state.v4.TimeTag.MS_PER_FRAME, animation, millisPerFrame);
      os.xml.appendElement(os.state.v4.TimeTag.PLAY_STATE, animation, playState);

      var tlContainer = goog.dom.getElementByClass('js-timeline');
      if (tlContainer) {
        os.xml.appendElement(os.state.v4.TimeTag.COLLAPSED, animation, os.ui.timeline.AbstractTimelineCtrl.collapsed);
        var visibleRange = angular.element(tlContainer).children().scope()['timeline'].getVisibleRange();
        os.xml.appendElement(os.state.v4.TimeTag.VISIBLE_RANGE, animation,
            this.rangeToDateFormatString_(new goog.math.Range(visibleRange.getStart(), visibleRange.getEnd())));
      }
    }

    var fade = moment.duration(tlc.getFade() ? tlc.getOffset() : 0).toISOString();
    var fadeEl = os.xml.appendElement(os.state.v4.TimeTag.FADE, rootObj);
    os.xml.appendElement('in', fadeEl, fade);
    os.xml.appendElement('out', fadeEl, fade);

    if (tlc.hasSliceRanges()) {
      rootObj.appendChild(this.sliceRangesToXml_(tlc.getSliceRanges()));
    }

    os.xml.appendElement(os.state.v4.TimeTag.DURATION, rootObj, tlc.getDuration());
    os.xml.appendElement(os.state.v4.TimeTag.LOCK, rootObj, tlc.getLock());
    os.xml.appendElement(os.state.v4.TimeTag.AUTO_CONFIGURE, rootObj, tlc.getAutoConfigure());

    this.saveComplete(options, rootObj);
  } catch (e) {
    this.saveFailed(e.message || 'Unspecified error.');
  }
};


/**
 * Returns true if the timeline is currently visible in the ui.
 *
 * @return {boolean}
 */
os.state.v4.TimeState.prototype.isTimeLineVisible = function() {
  var timeline = goog.dom.getElementByClass('js-timeline');
  return timeline != null;
};


/**
 * Returns heldIntervals element for timeranges.
 * NOTE: v4 heldIntervals can include an optional key element
 * which should be associated with a specific layer. Currently,
 * we do not support this feature, so it is not included.
 *
 * @param {Array<goog.math.Range>} timeranges
 * @return {!Element}
 * @private
 */
os.state.v4.TimeState.prototype.holdRangeToXml_ = function(timeranges) {
  var element = os.xml.createElement(os.state.v4.TimeTag.HOLDS);
  var dateString;
  var range;
  var held;

  for (var i = 0; i < timeranges.length; i = i + 1) {
    held = os.xml.createElement(os.state.v4.TimeTag.HOLD_ITEM);
    element.appendChild(held);
    range = timeranges[i];
    dateString = this.rangeToDateFormatString_(range);
    os.xml.appendElement(os.state.v4.TimeTag.SEQ_INTERVAL, held, dateString);
  }

  return element;
};


/**
 * Adds interval elements to the container for each range in timeranges
 *
 * @param {Array<goog.math.Range>} timeranges
 * @param {!Element} container
 * @private
 */
os.state.v4.TimeState.prototype.addRanges_ = function(timeranges, container) {
  var dateString;
  var range;

  for (var i = 0; i < timeranges.length; i = i + 1) {
    range = timeranges[i];
    dateString = this.rangeToDateFormatString_(range);
    os.xml.appendElement(os.state.v4.TimeTag.SEQ_INTERVAL, container, dateString);
  }
};


/**
 * Returns formatted date string for a range.
 *
 * @param {goog.math.Range} range [description]
 * @return {string}
 * @private
 */
os.state.v4.TimeState.prototype.rangeToDateFormatString_ = function(range) {
  var startDate = new Date(range.start);
  var endDate = new Date(range.end);
  return os.time.momentFormat(startDate, os.state.v4.TimeState.DATE_FORMAT, true) +
      '/' + os.time.momentFormat(endDate, os.state.v4.TimeState.DATE_FORMAT, true);
};


/**
 * Returns a range for a given interval string value
 *
 * @param {string} interval
 * @return {goog.math.Range}
 * @private
 */
os.state.v4.TimeState.prototype.intervalStringToRange_ = function(interval) {
  var parts = interval.split(/\//);
  var startDate = os.time.parseMoment(parts[0], [os.state.v4.TimeState.DATE_FORMAT], true);
  var endDate = os.time.parseMoment(parts[1], [os.state.v4.TimeState.DATE_FORMAT], true);
  return new goog.math.Range(startDate.valueOf(), endDate.valueOf());
};


/**
 * Reads the full time line range from the element
 *
 * @param {!Element} element
 * @return {goog.math.Range}
 * @private
 */
os.state.v4.TimeState.prototype.readRangeFromIntervals_ = function(element) {
  var range = null;

  // Create range from all interval elements, as desktop does not include a root interval.
  var intervalElements = element.querySelectorAll(os.state.v4.TimeTag.INTERVAL);
  if (intervalElements.length > 0) {
    var result = new goog.math.RangeSet();

    for (var i = 0; i < intervalElements.length; i = i + 1) {
      var interval = intervalElements[i].textContent;
      result.add(this.intervalStringToRange_(interval));
    }

    range = result.getBounds();
  }

  return range;
};


/**
 * Reads the duration from the element, or computes on
 * using the range.
 *
 * @param {!Element} element
 * @param {!goog.math.Range} range
 * @return {string}
 * @private
 */
os.state.v4.TimeState.prototype.readDuration_ = function(element, range) {
  var durationElement = element.querySelector(os.state.v4.TimeTag.DURATION);
  if (durationElement) {
    return durationElement.textContent;
  }
  // Desktop state files do not have a duration, use the range to determine.
  return this.getDurationFromDiff(range.end - range.start);
};


/**
 * Reads a collection of intervals and returns a RangeSet
 *
 * @param {!Element} element
 * @param {string} tag
 * @return {goog.math.RangeSet}
 * @private
 */
os.state.v4.TimeState.prototype.readIntervalsAsRangeSet_ = function(element, tag) {
  var rangeSet = new goog.math.RangeSet();
  if (element) {
    var parentElement = element.querySelector(tag);
    if (parentElement) {
      var intervals = parentElement.querySelectorAll(os.state.v4.TimeTag.INTERVAL);
      for (var i = 0; i < intervals.length; i = i + 1) {
        rangeSet.add(this.intervalStringToRange_(intervals[i].textContent));
      }
    }
  }
  return rangeSet;
};


/**
 * Get the duration represented by a time difference and optional number of intervals.
 *
 * @param {number} diff The time difference
 * @param {number=} opt_numIntervals The number of time intervals
 * @return {string} The duration
 * @protected
 */
os.state.v4.TimeState.prototype.getDurationFromDiff = function(diff, opt_numIntervals) {
  var numIntervals = opt_numIntervals !== undefined ? opt_numIntervals : 1;
  var val = null;

  if (diff >= 28 * 24 * 60 * 60 * 1000) {
    val = os.time.Duration.MONTH;
  } else if (numIntervals > 1 && diff >= 7 * 24 * 60 * 60 * 1000) {
    val = os.time.Duration.WEEK;
  } else if (numIntervals < 2 && diff == 7 * 24 * 60 * 60 * 1000) {
    val = os.time.Duration.WEEK;
  } else if (diff == 24 * 60 * 60 * 1000) {
    val = os.time.Duration.DAY;
  } else {
    val = os.time.Duration.CUSTOM;
  }

  return val;
};


/**
 * Reads the fps element.
 *
 * @param {!Element} element
 * @return {?number}
 * @private
 */
os.state.v4.TimeState.prototype.readFps_ = function(element) {
  var result = 0;
  var msPerFrameEl = element.querySelector(os.state.v4.TimeTag.MS_PER_FRAME);
  var msPerFrame = msPerFrameEl ? Number(msPerFrameEl.textContent) : 0;
  if (!isNaN(msPerFrame) && msPerFrame > 0) {
    result = Math.round(1000 / msPerFrame);
  }
  if (isNaN(result) || result === 0) {
    return null;
  }
  return result;
};


/**
 * Reads the current element.
 *
 * @param {!Element} element
 * @return {goog.math.Range}
 * @private
 */
os.state.v4.TimeState.prototype.readCurrent_ = function(element) {
  return this.readRange_(os.state.v4.TimeTag.CURRENT, element);
};


/**
 * Reads a range element.
 *
 * @param {!string} tag
 * @param {!Element} element
 * @return {goog.math.Range}
 * @private
 */
os.state.v4.TimeState.prototype.readRange_ = function(tag, element) {
  var rangeEl = element.querySelector(tag);
  var range = rangeEl ? rangeEl.textContent : undefined;
  if (range) {
    return this.intervalStringToRange_(range);
  }
  return null;
};


/**
 * Reads the visible range element.
 *
 * @param {!Element} element
 * @return {os.time.TimeRange}
 * @private
 */
os.state.v4.TimeState.prototype.readVisibleRange_ = function(element) {
  var currentEl = element.querySelector(os.state.v4.TimeTag.VISIBLE_RANGE);
  var visibleRange = currentEl ? currentEl.textContent : undefined;
  if (visibleRange) {
    var range = this.intervalStringToRange_(visibleRange);
    return new os.time.TimeRange(range.start, range.end);
  }
  return null;
};


/**
 * Reads the skip element.
 * @param {!Element} element
 * @return {?number}
 * @private
 */
os.state.v4.TimeState.prototype.readSkip_ = function(element) {
  var skipEl = element.querySelector(os.state.v4.TimeTag.ADVANCE);
  if (skipEl) {
    return moment.duration(skipEl.textContent).asMilliseconds();
  }
  return null;
};


/**
 * Reads the lock element.
 * @param {!Element} element
 * @return {?boolean}
 * @private
 */
os.state.v4.TimeState.prototype.readLock_ = function(element) {
  return this.readBoolean_(os.state.v4.TimeTag.LOCK, element);
};


/**
 * Reads the fade element.
 * @param {!Element} element
 * @return {?boolean}
 * @private
 */
os.state.v4.TimeState.prototype.readFade_ = function(element) {
  var fadeEl = element.querySelector(os.state.v4.TimeTag.FADE);
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
};


/**
 * Reads a boolean element.
 * @param {!string} tag
 * @param {!Element} element
 * @return {?boolean}
 * @private
 */
os.state.v4.TimeState.prototype.readBoolean_ = function(tag, element) {
  var booleanElement = element.querySelector(tag);
  if (booleanElement) {
    return booleanElement.textContent == 'true';
  }
  return null;
};


/**
 * Parse a time period into its component times.
 *
 * @param {string} period The period as "start/end"
 * @return {Array.<number>} The times represented by the period
 * @protected
 */
os.state.v4.TimeState.prototype.parsePeriod = function(period) {
  if (period) {
    var parts = period.split(/\//);
    if (parts.length > 1) {
      return [new Date(parts[0]).getTime(), new Date(parts[1]).getTime()];
    }
  }

  return null;
};

/**
 * Returns slice intervals element for timeranges.
 *
 * @param {Array<goog.math.Range>} sliceRanges
 * @return {!Element}
 * @private
 */
os.state.v4.TimeState.prototype.sliceRangesToXml_ = function(sliceRanges) {
  var slices = os.xml.createElement(os.state.v4.TimeTag.SLICES);

  for (var i = 0; i < sliceRanges.length; i++) {
    var slice = os.xml.createElement(os.state.v4.TimeTag.SLICE);
    slices.appendChild(slice);
    var interval = os.xml.createElement(os.state.v4.TimeTag.SLICE_INTERVAL);
    slice.appendChild(interval);
    var range = sliceRanges[i];
    os.xml.appendElement(os.state.v4.TimeTag.INTERVAL_START, interval, range.start);
    os.xml.appendElement(os.state.v4.TimeTag.INTERVAL_END, interval, range.end);
  }
  return slices;
};

/**
 * Reads a collection of slices and returns a RangeSet
 *
 * @param {!Element} element
 * @return {goog.math.RangeSet}
 * @private
 */
os.state.v4.TimeState.prototype.readSlicesAsRangeSet_ = function(element) {
  var rangeSet = new goog.math.RangeSet();
  if (element) {
    var slicesElement = element.querySelector(os.state.v4.TimeTag.SLICES);
    if (slicesElement) {
      var intervals = slicesElement.querySelectorAll(os.state.v4.TimeTag.SLICE_INTERVAL);
      for (var i = 0; i < intervals.length; i = i + 1) {
        var interval = intervals[i];
        rangeSet.add(this.sliceIntervalToRange_(interval));
      }
    }
  }
  return rangeSet;
};

/**
 * Returns a range for a given slice interval
 *
 * @param {!Element} interval
 * @return {goog.math.Range}
 * @private
 */
os.state.v4.TimeState.prototype.sliceIntervalToRange_ = function(interval) {
  var intervalStart = +interval.querySelector(os.state.v4.TimeTag.INTERVAL_START).textContent;
  var intervalEnd = +interval.querySelector(os.state.v4.TimeTag.INTERVAL_END).textContent;
  return new goog.math.Range(intervalStart, intervalEnd);
};
