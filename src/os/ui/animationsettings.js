goog.declareModuleId('os.ui.AnimationSettingsUI');

import './datetime/datetime.js';
import './popover/popover.js';
import Metrics from '../metrics/metrics.js';
import {Timeline as TimelineKeys} from '../metrics/metricskeys.js';
import {ROOT} from '../os.js';
import Duration from '../time/duration.js';
import {getTimeOffset, parse} from '../time/time.js';
import {DAY, MIN} from '../time/timeline.js';
import TimelineController from '../time/timelinecontroller.js';
import Module from './module.js';
import * as TimelineUI from './timeline/timelineui.js';
import {close} from './window.js';
import WindowEventType from './windoweventtype.js';

const dispose = goog.require('goog.dispose');
const {getDocument} = goog.require('goog.dom');
const KeyCodes = goog.require('goog.events.KeyCodes');
const KeyEvent = goog.require('goog.events.KeyEvent');
const KeyHandler = goog.require('goog.events.KeyHandler');
const Range = goog.require('goog.math.Range');


/**
 * The animation settings window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/windows/animationsettings.html',
  controller: Controller,
  controllerAs: 'animationCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'animationsettings';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the animation settings dialog
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

    /**
     * @type {?Date}
     * @protected
     */
    this.loadStart = null;

    /**
     * @type {?Date}
     * @protected
     */
    this.loadEnd = null;

    /**
     * @type {?Date}
     * @protected
     */
    this.loopStart = null;

    /**
     * @type {?Date}
     * @protected
     */
    this.loopEnd = null;

    this.populate();

    $scope.$watch('loopStart', this.onLoopDatesChange.bind(this));
    $scope.$watch('loopEnd', this.onLoopDatesChange.bind(this));
    $scope.$on('$destroy', this.onDestroy.bind(this));

    $scope['loopRangeTip'] = 'The time range used to animate data.';
    $scope['tilesTip'] = 'The size of each tile frame.';
    $scope['windowTip'] = 'The size of the blue active window.';
    $scope['skipTip'] = 'The amount of time that the active window skips forward or back with each frame.';
    $scope['fadeTip'] = 'Fade in/out features based on the size of your timeline window and scroll direction.';
    $scope['lockTip'] = 'During animation this causes the visible window to lock from the start point.';

    /**
     * @type {!KeyHandler}
     * @private
     */
    this.keyHandler_ = new KeyHandler(getDocument());
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
    this.loadStart = null;
    this.loadEnd = null;
    this.loopStart = null;
    this.loopEnd = null;
    this.scope = null;
    this.element = null;
  }

  /**
   * Populates the inital form values from the animation controller
   *
   * @protected
   */
  populate() {
    var tlc = TimelineController.getInstance();

    this.loadStart = new Date(tlc.getStart() + getTimeOffset());
    this.loadEnd = new Date(tlc.getEnd() + getTimeOffset());
    this.scope['autoConfig'] = tlc.getAutoConfigure();

    // if no animation ranges are defined, the loop is equal to the loaded range
    this.scope['autoLoop'] = !tlc.hasAnimationRanges();

    if (this.scope['autoLoop']) {
      this.scope['loopStart'] = this.loopStart = this.loadStart;
      this.scope['loopEnd'] = this.loopEnd = this.loadEnd;
    } else {
      this.scope['loopStart'] = this.loopStart = new Date(tlc.getLoopStart() + getTimeOffset());
      this.scope['loopEnd'] = this.loopEnd = new Date(tlc.getLoopEnd() + getTimeOffset());
    }

    // if the lock is used, use the original range for the window, not the current offset
    this.detectUnits(this.scope, tlc.getLock() ? tlc.getLockRange() : tlc.getOffset(), tlc.getSkip());
    this.autoConfigure();

    this.scope['duration'] = tlc.getDuration();
    this.scope['durations'] = ['day', 'week', 'month', 'year'];
    this.scope['units'] = Controller.UNITS;
    this.scope['fade'] = tlc.getFade();
    this.scope['lock'] = tlc.getLock();
  }

  /**
   * If there is a conflict that will change manually defined animation ranges.
   *
   * @return {boolean}
   * @export
   */
  hasMultipleRanges() {
    var tlc = TimelineController.getInstance();
    return tlc.getAnimationRanges().length > 1;
  }

  /**
   * Handles changes to loop dates
   *
   * @param {Date} newValue
   * @param {Date} oldValue
   * @protected
   */
  onLoopDatesChange(newValue, oldValue) {
    if (typeof this.scope['loopStart'] === 'string') {
      this.loopStart = parse(this.scope['loopStart'], null, true);
    }

    if (typeof this.scope['loopEnd'] === 'string') {
      this.loopEnd = parse(this.scope['loopEnd'], null, true);
    }

    this.autoConfigure();
  }

  /**
   * Sets the auto configuration
   *
   * @export
   */
  autoConfigure() {
    if (this.scope['autoConfig']) {
      var tlc = TimelineController.getInstance();
      var diff = tlc.getSmallestAnimateRangeLength();

      if (diff >= 28 * DAY - 30 * MIN) {
        this.setTileAnimation(7 * DAY, Duration.WEEK);
      } else if (diff >= 5 * DAY - 30 * MIN) {
        this.setTileAnimation(DAY, Duration.DAY);
      } else {
        var offset = TimelineUI.Controller.getSnap(diff / 24);
        var viewsize = tlc.getRange().getLength();
        if (offset < viewsize / 24) {
          offset = Math.min(diff / 2, viewsize / 24);
        }
        this.scope['duration'] = Duration.DAY;
        this.detectUnits(this.scope, offset, offset / 2);
      }
    }
  }

  /**
   * @param {Object<string, *>} obj
   * @param {number} win
   * @param {number} skip
   * @protected
   */
  detectUnits(obj, win, skip) {
    var units = Controller.UNITS;
    for (var i = 0, n = units.length; i < n; i++) {
      if (win % units[i].value === 0) {
        obj['windowUnit'] = units[i];
        obj['window'] = win / units[i].value;
      }

      if (skip % units[i].value === 0) {
        obj['skipUnit'] = units[i];
        obj['skip'] = skip / units[i].value;
      }
    }
  }

  /**
   * @param {number} offset
   * @param {string} duration
   * @protected
   */
  setTileAnimation(offset, duration) {
    this.scope['duration'] = duration;
    this.detectUnits(this.scope, offset, offset);
  }

  /**
   * @return {Date} The load start date
   * @protected
   */
  getLoadStart() {
    var start = this.loadStart;
    var end = this.loadEnd;
    return start.getTime() < end.getTime() ? start : end;
  }

  /**
   * @return {Date} The load end date
   * @protected
   */
  getLoadEnd() {
    var start = this.loadStart;
    var end = this.loadEnd;
    return start.getTime() < end.getTime() ? end : start;
  }

  /**
   * @return {Date} The loop start date
   * @protected
   */
  getLoopStart() {
    var start = this.loopStart;
    var end = this.loopEnd;
    return start.getTime() < end.getTime() ? start : end;
  }

  /**
   * @return {Date} The loop end date
   * @protected
   */
  getLoopEnd() {
    var start = this.loopStart;
    var end = this.loopEnd;
    return start.getTime() < end.getTime() ? end : start;
  }

  /**
   * Apply the settings
   *
   * @export
   */
  accept() {
    var tlc = TimelineController.getInstance();

    if (this.scope['fade'] != tlc.getFade()) { // turn fade on/off (this will reset feature opacity if needed)
      tlc.setFade(this.scope['fade']);
    }

    if (this.scope['lock'] != tlc.getLock()) { // turn lock on/off
      tlc.updateLock(this.scope['lock']);
      Metrics.getInstance().updateMetric(TimelineKeys.LOCK, 1);
    }

    // TODO animation ranges

    // always clear animate ranges on save
    tlc.clearAnimateRanges();

    // if a manual range was provided, set it now
    if (!this.scope['autoLoop']) {
      var loopStart = this.loopStart.getTime() - getTimeOffset();
      var loopEnd = this.loopEnd.getTime() - getTimeOffset();
      if (loopStart != loopEnd) {
        // only add the range if the start/end aren't equal
        var range = new Range(loopStart, loopEnd);
        tlc.addAnimateRange(range);
      }
    }

    // do window/skip
    tlc.setAutoConfigure(this.scope['autoConfig']);

    tlc.setOffset(this.scope['window'] * this.scope['windowUnit']['value']);
    if (tlc.getLock()) {
      tlc.setLockRange(tlc.getOffset());
    }
    tlc.setSkip(this.scope['skip'] * this.scope['skipUnit']['value']);
    tlc.setDuration(this.scope['duration']);

    tlc.setCurrent(tlc.getLoopStart() + tlc.getOffset());

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
    close(this.element);
  }

  /**
   * Handles the ui fade checkbox toggle
   *
   * @export
   */
  onFadeChange() {
    Metrics.getInstance().updateMetric(TimelineKeys.FADE, 1);
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
}

/**
 * @type {Array<{label: string, value: number}>}
 * @const
 */
Controller.UNITS = [{
  label: 'ms',
  value: 1
}, {
  label: 'secs',
  value: 1000
}, {
  label: 'mins',
  value: 60 * 1000
}, {
  label: 'hrs',
  value: 60 * 60 * 1000
}, {
  label: 'days',
  value: 24 * 60 * 60 * 1000
}, {
  label: 'weeks',
  value: 7 * 24 * 60 * 60 * 1000
}];
