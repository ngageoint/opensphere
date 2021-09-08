goog.module('os.ui.datetime.DateControlUI');

goog.require('os.ui.datetime.WheelDateUI');

const Disposable = goog.require('goog.Disposable');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const {ROOT} = goog.require('os');
const time = goog.require('os.time');
const Duration = goog.require('os.time.Duration');
const TimelineController = goog.require('os.time.TimelineController');
const TimelineEventType = goog.require('os.time.TimelineEventType');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');

const TimelineControllerEvent = goog.requireType('os.time.TimelineControllerEvent');


/**
 * The date-control directive.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/datetime/datecontrol.html',
  controller: Controller,
  controllerAs: 'dateControl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'date-control';

/**
 * Add the directive to the module.
 */
Module.directive('dateControl', [directive]);

/**
 * Controller for the date-control directive.
 * @unrestricted
 */
class Controller extends Disposable {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @ngInject
   */
  constructor($scope) {
    super();

    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * The timeline controller.
     * @type {?TimelineController}
     * @private
     */
    this.tlc_ = TimelineController.getInstance();
    this.tlc_.listen(TimelineEventType.RESET, this.onTimelineReset_, false, this);

    /**
     * Timer to debounce updates to the timeline controller.
     * @type {Delay}
     * @private
     */
    this.updateControllerDelay_ = new Delay(this.updateController_, 10, this);

    /**
     * The start date.
     * @type {Date}
     */
    this['startDate'] = time.toLocalDate(new Date(this.tlc_.getStart()));

    /**
     * The end date. Inclusive for custom duration.
     * @type {Date}
     */
    this['endDate'] = this.getUIEndDate();

    /**
     * The current duration choice.
     * @type {string}
     */
    this['duration'] = this.getDuration();

    /**
     * Available duration choices in the UI.
     * @type {!Array<string>}
     */
    this['durations'] = [
      Duration.DAY,
      Duration.WEEK,
      Duration.MONTH,
      Duration.LAST24HOURS,
      Duration.LAST48HOURS,
      Duration.LAST7DAYS,
      Duration.LAST14DAYS,
      Duration.LAST30DAYS,
      Duration.CUSTOM
    ];

    /**
     * If the control is disabled (not impacting the timeline controller).
     * @type {boolean}
     */
    this['disabled'] = false;

    /**
     * If the duration is relative to the current date.
     * @type {boolean}
     */
    this['relativeDuration'] = time.isRelativeDuration(this['duration']);

    // take over updating the timeline controller
    this.assumeControl();

    // watch for changes to start/end dates
    $scope.$watch('dateControl.startDate', this.onStartDateChanged_.bind(this));
    $scope.$watch('dateControl.endDate', this.onEndDateChanged_.bind(this));

    $scope.$on('startDate.userSelected', this.onStartDateSelected_.bind(this));
    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispose(this.updateControllerDelay_);
    this.updateControllerDelay_ = null;

    this.tlc_.unlisten(TimelineEventType.RESET, this.onTimelineReset_, false, this);
    this.tlc_ = null;

    this.scope_ = null;
  }

  /**
   * Change handler for the start date control.
   *
   * @param {?Date} newVal The new value.
   * @param {?Date} oldVal The old value.
   * @private
   */
  onStartDateChanged_(newVal, oldVal) {
    if (newVal && oldVal && newVal.getTime() != oldVal.getTime()) {
      if (!this['relativeDuration'] && this['duration'] != Duration.CUSTOM) {
        this['startDate'] = time.floor(newVal, this['duration'], true);
      } else {
        this['startDate'] = newVal;
      }

      if (this['duration'] === Duration.CUSTOM) {
        // if the start date is after the end date for custom duration, make them the same (end is inclusive)
        if (this['startDate'] > this['endDate']) {
          this['endDate'] = new Date(this['startDate']);
        }
      } else if (!this['relativeDuration']) {
        // for all other durations (that aren't relative), set the end date from the start date
        this['endDate'] = time.offset(this['startDate'], this['duration'], 1, true);
      }

      if (!this['disabled']) {
        this.startControllerUpdate_();
      }

      log.fine(logger,
          'start changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
    }
  }

  /**
   * Selection handler for start date control.
   *
   * @param {angular.Scope.Event} event
   * @private
   */
  onStartDateSelected_(event) {
    event.stopPropagation();
    this.scope_.$broadcast('endDate.open');
  }

  /**
   * Change handler for the end date control.
   *
   * @param {?Date} newVal The new value.
   * @param {?Date} oldVal The old value.
   * @private
   */
  onEndDateChanged_(newVal, oldVal) {
    // this can only be changed by the user for custom duration, so let the controller handle it otherwise
    if (this['duration'] === Duration.CUSTOM && newVal && oldVal && newVal.getTime() != oldVal.getTime()) {
      this['endDate'] = newVal;

      if (this['startDate'] > this['endDate']) {
        // if start is after end, make them the same (end is inclusive)
        this['startDate'] = new Date(this['endDate']);
      }

      if (!this['disabled']) {
        this.startControllerUpdate_();
      }

      log.fine(logger,
          'end changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
    }
  }

  /**
   * Change handler for duration chooser.
   *
   * @export
   */
  onDurationChanged() {
    if (!this['disabled']) {
      // If switching from a relative duration, make the new start relative to now.
      if (this['relativeDuration']) {
        this['startDate'] = new Date();
      }

      // We only want to round times that are neither custom nor relative
      if (!this['relativeDuration'] && this['duration'] != Duration.CUSTOM) {
        this['startDate'] = time.floor(this['startDate'], this['duration'], true);
      }

      // Check if the NEW duration is relative
      this['relativeDuration'] = time.isRelativeDuration(this['duration']);

      switch (this['duration']) {
        case Duration.LAST24HOURS:
          this.setRelativeDateRange(1);
          break;
        case Duration.LAST48HOURS:
          this.setRelativeDateRange(2);
          break;
        case Duration.LAST7DAYS:
          this.setRelativeDateRange(7);
          break;
        case Duration.LAST14DAYS:
          this.setRelativeDateRange(14);
          break;
        case Duration.LAST30DAYS:
          this.setRelativeDateRange(30);
          break;
        case Duration.CUSTOM:
          // for custom duration, make dates the same (end is inclusive)
          this['endDate'] = new Date(this['startDate']);
          break;
        default:
          // for all other durations, set the end date from the start date
          this['endDate'] = time.offset(this['startDate'], this['duration'], 1, true);
          break;
      }
      this.startControllerUpdate_();

      log.fine(logger,
          'duration changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
    }
  }

  /**
   * Set the duration to a date range relative to now.
   *
   * @param {number} days
   * @private
   */
  setRelativeDateRange(days) {
    this['startDate'] = new Date();
    this['endDate'] = new Date();
    this['startDate'].setUTCDate(this['startDate'].getUTCDate() - days);
  }

  /**
   * Start the delay to update the timeline controller.
   *
   * @private
   */
  startControllerUpdate_() {
    if (this.updateControllerDelay_) {
      this.updateControllerDelay_.start();
    }
  }

  /**
   * Updates the start/end date on the timeline controller.
   *
   * @private
   */
  updateController_() {
    if (this.tlc_) {
      // convert local dates to utc before setting timeline controller values
      var controllerStart = this.getControllerStartDate();
      var controllerEnd = this.getControllerEndDate();
      var startTime = controllerStart.getTime();
      var endTime = controllerEnd.getTime();

      this.tlc_.setSuppressShowEvents(true);
      this.tlc_.setRange(this.tlc_.buildRange(startTime, endTime));
      this.tlc_.setDuration(this['duration']);
      this.tlc_.setOffset(this.tlc_.getSmallestAnimateRangeLength());
      this.tlc_.setSuppressShowEvents(false);
      this.tlc_.setCurrent(endTime);
    }
  }

  /**
   * Change handler for duration chooser.
   *
   * @param {number} direction
   * @export
   */
  shiftDate(direction) {
    var modifier = 1;
    if (!this['disabled']) {
      if (this['duration'] === Duration.CUSTOM) {
        // For custom durations, multiply the offset by the difference in days between the start and end dates
        const startDate = this['startDate'].getTime();
        const endDate = this['endDate'].getTime() + time.millisecondsInDay;
        modifier = (endDate - startDate) / time.millisecondsInDay;
      }
      this['startDate'] = time.offset(this['startDate'], this['duration'], direction * modifier, true);
      this['endDate'] = time.offset(this['endDate'], this['duration'], direction * modifier, true);
    }
  }

  /**
   * Enables the date control to update the timeline controller.
   */
  assumeControl() {
    if (this.tlc_) {
      this.tlc_.stop();
      this.tlc_.clearSliceRanges();
      this.updateController_();
    }

    this['disabled'] = false;
  }

  /**
   * Suspends the date control from updating the timeline controller.
   */
  releaseControl() {
    this['disabled'] = true;
  }

  /**
   * Updates the control from the timeline controller.
   */
  update() {
    if (this.tlc_) {
      this['duration'] = this.getDuration();
      this['relativeDuration'] = time.isRelativeDuration(this['duration']);
      this['startDate'] = this.getUIStartDate();
      this['endDate'] = this.getUIEndDate();

      apply(this.scope_);
    }
  }

  /**
   * Get the duration from the timeline controller.
   *
   * @return {string} The duration, or `Duration.DAY` if the timeline controller is not available.
   * @protected
   */
  getDuration() {
    return this.tlc_ ? this.tlc_.getDuration() : Duration.DAY;
  }

  /**
   * Get the start date from the UI to set in the timeline controller.
   *
   * @return {Date} The start date.
   * @protected
   */
  getControllerStartDate() {
    // Dates relative to "now" should not be translated to UTC because they did not come from jQueryUI.
    return this['relativeDuration'] ? this['startDate'] : time.toUTCDate(this['startDate']);
  }

  /**
   * Get the end date from the UI to set in the timeline controller.
   *
   * @return {Date} The end date.
   * @protected
   */
  getControllerEndDate() {
    // Dates relative to "now" should not be translated to UTC because they did not come from jQueryUI.
    var endDate = this['relativeDuration'] ? this['endDate'] : time.toUTCDate(this['endDate']);
    if (this['duration'] === Duration.CUSTOM) {
      endDate.setDate(endDate.getDate() + 1);
    }

    return endDate;
  }

  /**
   * Get the start date from the timeline controller to display in the UI.
   *
   * @return {Date} The start date.
   * @protected
   */
  getUIStartDate() {
    if (this.tlc_) {
      // Dates relative to "now" should not be translated from UTC because they will not be used by jQueryUI.
      var tlcStartDate = new Date(this.tlc_.getStart());
      return this['relativeDuration'] ? tlcStartDate : time.toLocalDate(tlcStartDate);
    }

    return null;
  }

  /**
   * Get the end date from the timeline controller to display in the UI.
   *
   * @return {Date} The end date.
   * @protected
   */
  getUIEndDate() {
    if (this.tlc_) {
      // Dates relative to "now" should not be translated from UTC because they will not be used by jQueryUI.
      var tlcEndDate = new Date(this.tlc_.getEnd());
      var endDate = this['relativeDuration'] ? tlcEndDate : time.toLocalDate(tlcEndDate);

      if (this['duration'] === Duration.CUSTOM) {
        endDate.setDate(endDate.getDate() - 1);
      }

      return endDate;
    }

    return null;
  }

  /**
   * Handler for timeline reset.
   *
   * @param {TimelineControllerEvent} event
   * @private
   */
  onTimelineReset_(event) {
    this.update();
  }
}

/**
 * The logger.
 * @type {goog.log.Logger}
 */
const logger = log.getLogger('os.ui.datetime.DateControlUI');

exports = {
  Controller,
  directive,
  directiveTag
};
