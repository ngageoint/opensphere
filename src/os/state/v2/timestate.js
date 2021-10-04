goog.declareModuleId('os.state.v2.TimeState');

import * as dispatcher from '../../dispatcher.js';
import Duration from '../../time/duration.js';
import {momentFormat, parseMoment} from '../../time/time.js';
import {autoConfigureFromTimeRange, setDefaultOffsetForRange} from '../../time/timeline.js';
import TimelineController from '../../time/timelinecontroller.js';
import UIEvent from '../../ui/events/uievent.js';
import UIEventType from '../../ui/events/uieventtype.js';
import {appendElement} from '../../xml.js';
import XMLState from '../xmlstate.js';
import TimeTag from './timetag.js';

const ConditionalDelay = goog.require('goog.async.ConditionalDelay');
const {getElementByClass} = goog.require('goog.dom');
const log = goog.require('goog.log');
const Range = goog.require('goog.math.Range');
const RangeSet = goog.require('goog.math.RangeSet');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
export default class TimeState extends XMLState {
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
      var fullTimeLineRange = this.readRangeFromIntervals_(obj);
      var current = this.readCurrent_(obj);

      // Desktop may only provide a current tag if the Time state is exported, but not the Animation state. in that
      // case, treat current as the loaded range.
      if (!fullTimeLineRange && current) {
        fullTimeLineRange = new Range(current.start, current.end);
      }

      if (fullTimeLineRange) {
        // set the duration first since doing so will clear animate/hold ranges
        var duration = this.readDuration_(obj, fullTimeLineRange) || undefined;
        if (duration) {
          tlc.setDuration(duration);
        }

        var animateRanges = this.readIntervalsAsRangeSet_(obj, TimeTag.SEQUENCE);
        var fullRangeSet = new RangeSet();
        fullRangeSet.add(fullTimeLineRange);

        // if the animate range is equal to the loaded range, clear out the animate ranges
        if (RangeSet.equals(fullRangeSet, animateRanges)) {
          tlc.clearAnimateRanges();
        } else {
          tlc.setAnimateRanges(animateRanges);
        }

        tlc.setHoldRanges(this.readIntervalsAsRangeSet_(obj, TimeTag.HOLDS));
        tlc.setRange(fullTimeLineRange);

        // make sure we have good defaults when the timeline is open. this changes the timeline controller duration to the
        // value used for tile ranges with the timeline open, so we don't want it called if the timeline is closed.
        if (tActive) {
          autoConfigureFromTimeRange(tlc, duration);
          setDefaultOffsetForRange(tlc, fullTimeLineRange.end - fullTimeLineRange.start);
        }
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

      // force the date control to update from the timeline controller
      var dcScope = angular.element('.js-date-control').scope();
      if (dcScope) {
        dcScope['dateControl'].update();
      }

      if (tActive) {
        // force the timeline panel to update from the timeline controller
        var tlContainer = getElementByClass('js-timeline');
        if (tlContainer) {
          // otherwise force it to update the viewable range if it was already open
          angular.element(tlContainer).scope()['timelineCtrl'].updateTimeline(true);
        }

        var stateEl = animationEl.querySelector(TimeTag.PLAY_STATE);
        if (stateEl && stateEl.textContent == 'Forward') {
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

      var currentRange = new Range(tlc.getCurrent() - tlc.getOffset(), tlc.getCurrent());
      var advance = moment.duration(tlc.getSkip()).toISOString();

      // Root level interval is the full animation range.
      appendElement(TimeTag.INTERVAL, rootObj,
          this.rangeToDateFormatString_(tlc.getRange()));
      appendElement(TimeTag.CURRENT, rootObj,
          this.rangeToDateFormatString_(currentRange));
      appendElement(TimeTag.ADVANCE, rootObj, advance);

      if (tlc.hasAnimationRanges()) {
        // NOTE: Using the sequence element for animation ranges. As of 08/24/2016
        // Desktop was not using this element.
        var sequence = /** @type {!Element} */ (appendElement(TimeTag.SEQUENCE, rootObj));
        this.addRanges_(tlc.getAnimationRanges(), sequence);
      }

      if (tlc.hasHoldRanges()) {
        var holds = /** @type {!Element} */ (appendElement(TimeTag.HOLDS, rootObj));
        this.addRanges_(tlc.getHoldRanges(), holds);
      }

      var timeline = getElementByClass('js-timeline');
      if (timeline != null) {
        // TODO: I think loop is OBE, as the hold/animate loops really handle this.
        // Using the full animation range for now.
        var loop = this.rangeToDateFormatString_(tlc.getAnimationRange());
        var loopBehavior = 'taperEndSnapStart';
        var millisPerFrame = Math.floor(Math.round(1000 / tlc.getFps()));
        var playState = tlc.isPlaying() ? 'Forward' : 'Stop';

        var animation = appendElement(TimeTag.ANIMATION, rootObj);
        appendElement(TimeTag.LOOP, animation, loop);
        appendElement(TimeTag.LOOP_BEHAVIOR, animation, loopBehavior);
        appendElement(TimeTag.MS_PER_FRAME, animation, millisPerFrame);
        appendElement(TimeTag.PLAY_STATE, animation, playState);
      }

      appendElement(TimeTag.DURATION, rootObj, tlc.getDuration());

      this.saveComplete(options, rootObj);
    } catch (e) {
      this.saveFailed(e.message || 'Unspecified error.');
    }
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
   * Reads a collection of intervals and retruns a RangeSet
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
    var currentEl = element.querySelector(TimeTag.CURRENT);
    var current = currentEl ? currentEl.textContent : undefined;
    if (current) {
      return this.intervalStringToRange_(current);
    }
    return null;
  }

  /**
   * Reards the skip element.
   *
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
   * Parse a time period into its component times.
   *
   * @param {string} period The period as "start/end"
   * @return {Array<number>} The times represented by the period
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
const logger = log.getLogger('os.state.v2.TimeState');

/**
 * Time format string.
 * @const
 */
TimeState.DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ss[Z]';
