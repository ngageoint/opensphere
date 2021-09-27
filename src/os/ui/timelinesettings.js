goog.declareModuleId('os.ui.TimeSettingsUI');

import './datetime/datetime.js';
import './popover/popover.js';
import './time/time.js';
import {ROOT} from '../os.js';
import Module from './module.js';
import * as osWindow from './window.js';
import WindowEventType from './windoweventtype.js';

const dispose = goog.require('goog.dispose');
const dom = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const RangeSet = goog.require('goog.math.RangeSet');
const Metrics = goog.require('os.metrics.Metrics');
const keys = goog.require('os.metrics.keys');
const time = goog.require('os.time');
const TimelineController = goog.require('os.time.TimelineController');
const TimelineEventType = goog.require('os.time.TimelineEventType');

const Range = goog.requireType('goog.math.Range');
const TimelineUI = goog.requireType('os.ui.timeline.TimelineUI');


/**
 * The timeline settings window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/timelinesettings.html',
  controller: Controller,
  controllerAs: 'timeCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'timesettings';


/**
 * Add the directive to the module
 */
Module.directive('timesettings', [directive]);



/**
 * Controller for the timeline settings dialog
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    this.populate();
    this.scope.$on('$destroy', this.onDestroy.bind(this));
    this.scope['loadStartTip'] = 'The start of a time range used to load data.';
    this.scope['loadEndTip'] = 'The end of a time range used to load data.';
    this.scope['sliceTip'] = 'A time range less than 24 hours to show data from each loaded day.';
    this.scope['sliceStartTip'] = 'The start of a slice used to load data. Start can be later than end if it crosses ' +
        'midnight.';
    this.scope['sliceEndTip'] = 'The end of a slice used to load data.';
    this.scope['offsetTip'] = 'All times will be shown with this offset (or time zone).';
    this.scope['sliceModels'] = {};

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(dom.getDocument());
    this.keyHandler_.listen(KeyEvent.EventType.KEY, this.handleKeyEvent_, false, this);

    this.scope.$emit(WindowEventType.READY);
  }

  /**
   * Clean up
   *
   * @protected
   */
  onDestroy() {
    dispose(this.keyHandler_);
    this.element = null;
    this.scope = null;
  }

  /**
   * Populates the inital form values from the timeline controller
   *
   * @protected
   */
  populate() {
    var tlc = TimelineController.getInstance();

    this.scope['offset'] = 'UTC' + (time.getTimeOffsetLabel() == 'Z' ? '+0000' : time.getTimeOffsetLabel());
    this.scope['loadRanges'] = this.fromRangesToDates(tlc.getLoadRanges());
    this.scope['sliceRanges'] = this.fromSlicesToHMS(tlc.getSliceRanges());
  }

  /**
   * Apply the settings
   *
   * @export
   */
  accept() {
    var tlc = TimelineController.getInstance();

    // do offset
    time.applyOffset(this.scope['offset']);

    var sr = this.scope['sliceRanges'];
    var rangeSet = new RangeSet();
    for (var i = 0; i < sr.length; i++) {
      var start = sr[i]['start']['hours'] * 3600000 + sr[i]['start']['mins'] * 60000 + sr[i]['start']['secs'] * 1000;
      var end = sr[i]['end']['hours'] * 3600000 + sr[i]['end']['mins'] * 60000 + sr[i]['end']['secs'] * 1000;
      if (start > end) { // make 2 slices if it crosses midnight
        rangeSet.add(tlc.buildRange(0, end));
        end = 86400000;
      }
      rangeSet.add(tlc.buildRange(start, end)); // combines overlapping ranges
    }
    tlc.setSliceRanges(rangeSet);

    var loadRanges = this.scope['loadRanges'];
    if (loadRanges.length > 0) {
      var loadSet = new RangeSet();
      tlc.clearLoadRanges();
      for (var i = 0; i < loadRanges.length; i++) {
        var start = this.timeFromField(loadRanges[i].start);
        var end = this.timeFromField(loadRanges[i].end);
        var first = start;
        var last = end;
        if (start > end) {
          first = end;
          last = start;
        }
        loadSet.add(tlc.buildRange(first, last)); // combines overlapping ranges!
      }
      tlc.setLoadRanges(loadSet);
      tlc.dispatchEvent(TimelineEventType.REFRESH_LOAD);

      Metrics.getInstance().updateMetric(keys.Timeline.TIME_RANGE, 1);
    }

    // move the view
    const controller = /** @type {TimelineUI.Controller} */ (this.scope['timeline']);
    controller.zoomToExtent([tlc.getStart(), tlc.getEnd()]);
    this.cancel();
  }

  /**
   * Cancel/Close
   *
   * @export
   */
  cancel() {
    osWindow.close(this.element);
  }

  /**
   * Handles key events
   *
   * @param {KeyEvent} event
   * @private
   */
  handleKeyEvent_(event) {
    if (event.keyCode == KeyCodes.ESC) {
      this.cancel();
    } else if (event.keyCode == KeyCodes.ENTER) {
      this.accept();
    }
  }

  /**
   * Add a slice
   *
   * @export
   */
  addSlice() {
    var slice = {'start': {'hours': 0, 'mins': 0, 'secs': 0}, 'end': {'hours': 1, 'mins': 0, 'secs': 0}};
    var last = this.scope['sliceRanges'].length ?
      this.scope['sliceRanges'][this.scope['sliceRanges'].length - 1] : null;
    if (last) {
      slice = {
        'start': {
          'hours': last['start']['hours'],
          'mins': last['start']['mins'],
          'secs': last['start']['secs']
        },
        'end': {
          'hours': last['end']['hours'],
          'mins': last['end']['mins'],
          'secs': last['end']['secs']
        }
      };
    }
    this.scope['sliceRanges'].push(slice);
  }

  /**
   * Remove a slice
   *
   * @param {number} index
   * @export
   */
  removeSlice(index) {
    this.scope['sliceRanges'].splice(index, 1);
  }

  /**
   * Add a load range
   *
   * @export
   */
  addRange() {
    var range = this.scope['loadRanges'][this.scope['loadRanges'].length - 1];
    this.scope['loadRanges'].push({'start': range.start, 'end': range.end});
  }

  /**
   * Remove a load range
   *
   * @param {number} index
   * @export
   */
  removeRange(index) {
    this.scope['loadRanges'].splice(index, 1);
  }

  /**
   * @param {!Array<Range>} ranges
   * @return {Array<Object>}
   * @protected
   */
  fromRangesToDates(ranges) {
    var dates = /** @type {Array<Object>}  */ ([]);
    for (var i = 0; i < ranges.length; i++) {
      dates.push({
        'start': (new Date(ranges[i].start + time.getTimeOffset())).toISOString(),
        'end': (new Date(ranges[i].end + time.getTimeOffset())).toISOString()
      });
    }
    return dates;
  }

  /**
   * @param {!Array<Range>} ranges
   * @return {Array<Object>}
   * @protected
   */
  fromSlicesToHMS(ranges) {
    var dates = /** @type {Array<Object>}  */ ([]);
    for (var i = 0; i < ranges.length; i++) {
      if (ranges[i].end == 86400000) { // subtract a second so it displays correctly
        ranges[i].end = 86399000;
      }
      dates.push({
        'start': {
          'hours': Math.floor(ranges[i].start / 3600000),
          'mins': Math.floor(ranges[i].start / 60000) % 60,
          'secs': Math.floor(ranges[i].start / 1000) % 60
        },
        'end': {
          'hours': Math.floor(ranges[i].end / 3600000),
          'mins': Math.floor(ranges[i].end / 60000) % 60,
          'secs': Math.floor(ranges[i].end / 1000) % 60
        }
      });
    }
    return dates;
  }

  /**
   * translates timestring into time number
   *
   * @param {string|Date} field
   * @return {number}
   * @protected
   */
  timeFromField(field) {
    return (typeof field === 'string' ? time.parse(field, null, true) : field).getTime() - time.getTimeOffset();
  }

  /**
   * Checks for valid
   *
   * @return {boolean}
   * @export
   */
  valid() {
    var loadRanges = this.scope['loadRanges'];
    for (var i = 0; i < loadRanges.length; i++) {
      var start = this.timeFromField(loadRanges[i].start);
      var end = this.timeFromField(loadRanges[i].end);
      if (start >= end) {
        return false;
      }
    }

    return true;
  }

  /**
   * Checks for valid time range
   *
   * @param {string} start
   * @param {string} end
   * @return {boolean}
   * @export
   */
  isValid(start, end) {
    return new Date(start) < new Date(end);
  }

  /**
   * Checks for valid slice
   *
   * @param {Object} start
   * @param {Object} end
   * @param {boolean=} opt_ignore
   * @return {boolean}
   * @export
   */
  isValidSlice(start, end, opt_ignore) {
    var valid = true;
    if (start && end) {
      var first = start['hours'] * 3600000 + start['mins'] * 60000 + start['secs'] * 1000;
      var last = end['hours'] * 3600000 + end['mins'] * 60000 + end['secs'] * 1000;
      valid = first <= last || opt_ignore;
    }
    return /** @type {boolean} */ (valid);
  }
}
