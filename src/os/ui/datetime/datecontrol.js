goog.provide('os.ui.datetime.DateControlCtrl');
goog.provide('os.ui.datetime.dateControlDirective');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('os.time');
goog.require('os.time.Duration');
goog.require('os.time.TimeRange');
goog.require('os.time.TimelineController');
goog.require('os.time.TimelineControllerEvent');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.wheelDateDirective');


/**
 * The date-control directive.
 *
 * @return {angular.Directive}
 */
os.ui.datetime.dateControlDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/datetime/datecontrol.html',
    controller: os.ui.datetime.DateControlCtrl,
    controllerAs: 'dateControl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('dateControl', [os.ui.datetime.dateControlDirective]);


/**
 * Controller for the date-control directive.
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.datetime.DateControlCtrl = function($scope) {
  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The timeline controller.
   * @type {?os.time.TimelineController}
   * @private
   */
  this.tlc_ = os.time.TimelineController.getInstance();
  this.tlc_.listen(os.time.TimelineEventType.RESET, this.onTimelineReset_, false, this);

  /**
   * Timer to debounce updates to the timeline controller.
   * @type {goog.async.Delay}
   * @private
   */
  this.updateControllerDelay_ = new goog.async.Delay(this.updateController_, 10, this);

  /**
   * The start date.
   * @type {Date}
   */
  this['startDate'] = os.time.toLocalDate(new Date(this.tlc_.getStart()));

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
    os.time.Duration.DAY,
    os.time.Duration.WEEK,
    os.time.Duration.MONTH,
    os.time.Duration.LAST24HOURS,
    os.time.Duration.LAST48HOURS,
    os.time.Duration.LAST7DAYS,
    os.time.Duration.LAST14DAYS,
    os.time.Duration.LAST30DAYS,
    os.time.Duration.CUSTOM
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
  this['relativeDuration'] = false;

  // take over updating the timeline controller
  this.assumeControl();

  // watch for changes to start/end dates
  $scope.$watch('dateControl.startDate', this.onStartDateChanged_.bind(this));
  $scope.$watch('dateControl.endDate', this.onEndDateChanged_.bind(this));

  $scope.$on('startDate.userSelected', this.onStartDateSelected_.bind(this));
  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.datetime.DateControlCtrl, goog.Disposable);


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.ui.datetime.DateControlCtrl.LOGGER_ = goog.log.getLogger('os.ui.datetime.DateControlCtrl');


/**
 * @inheritDoc
 */
os.ui.datetime.DateControlCtrl.prototype.disposeInternal = function() {
  os.ui.datetime.DateControlCtrl.base(this, 'disposeInternal');

  goog.dispose(this.updateControllerDelay_);
  this.updateControllerDelay_ = null;

  this.tlc_.unlisten(os.time.TimelineEventType.RESET, this.onTimelineReset_, false, this);
  this.tlc_ = null;

  this.scope_ = null;
};


/**
 * Change handler for the start date control.
 *
 * @param {?Date} newVal The new value.
 * @param {?Date} oldVal The old value.
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.onStartDateChanged_ = function(newVal, oldVal) {
  if (newVal && oldVal && newVal.getTime() != oldVal.getTime()) {
    this['startDate'] = os.time.floor(newVal, this['duration'], true);

    if (this['duration'] === os.time.Duration.CUSTOM) {
      // if the start date is after the end date for custom duration, make them the same (end is inclusive)
      if (this['startDate'] > this['endDate']) {
        this['endDate'] = new Date(this['startDate']);
      }
    } else if (!this['relativeDuration']) {
      // for all other durations (that aren't relative), set the end date from the start date
      this['endDate'] = os.time.offset(this['startDate'], this['duration'], 1, true);
    }

    if (!this['disabled']) {
      this.startControllerUpdate_();
    }

    goog.log.fine(os.ui.datetime.DateControlCtrl.LOGGER_,
        'start changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
  }
};


/**
 * Selection handler for start date control.
 *
 * @param {angular.Scope.Event} event
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.onStartDateSelected_ = function(event) {
  event.stopPropagation();
  this.scope_.$broadcast('endDate.open');
};


/**
 * Change handler for the end date control.
 *
 * @param {?Date} newVal The new value.
 * @param {?Date} oldVal The old value.
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.onEndDateChanged_ = function(newVal, oldVal) {
  // this can only be changed by the user for custom duration, so let the controller handle it otherwise
  if (this['duration'] === os.time.Duration.CUSTOM && newVal && oldVal && newVal.getTime() != oldVal.getTime()) {
    this['endDate'] = os.time.floor(newVal, os.time.Duration.DAY, true);

    if (this['startDate'] > this['endDate']) {
      // if start is after end, make them the same (end is inclusive)
      this['startDate'] = new Date(this['endDate']);
    }

    if (!this['disabled']) {
      this.startControllerUpdate_();
    }

    goog.log.fine(os.ui.datetime.DateControlCtrl.LOGGER_,
        'end changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
  }
};


/**
 * Change handler for duration chooser.
 *
 * @export
 */
os.ui.datetime.DateControlCtrl.prototype.onDurationChanged = function() {
  if (!this['disabled']) {
    this['relativeDuration'] = false;
    this['startDate'] = os.time.floor(this['startDate'], this['duration'], true);

    switch (this['duration']) {
      case os.time.Duration.LAST24HOURS:
        this.setRelativeDateRange(1);
        break;
      case os.time.Duration.LAST48HOURS:
        this.setRelativeDateRange(2);
        break;
      case os.time.Duration.LAST7DAYS:
        this.setRelativeDateRange(7);
        break;
      case os.time.Duration.LAST14DAYS:
        this.setRelativeDateRange(14);
        break;
      case os.time.Duration.LAST30DAYS:
        this.setRelativeDateRange(30);
        break;
      case os.time.Duration.CUSTOM:
        // for custom duration, make dates the same (end is inclusive)
        this['endDate'] = new Date(this['startDate']);
        break;
      default:
        // for all other durations, set the end date from the start date
        this['endDate'] = os.time.offset(this['startDate'], this['duration'], 1, true);
        break;
    }
    this.startControllerUpdate_();

    goog.log.fine(os.ui.datetime.DateControlCtrl.LOGGER_,
        'duration changed: ' + this['startDate'].toUTCString() + ' to ' + this['endDate'].toUTCString());
  }
};


/**
 * Set the duration to a date range relative to now.
 *
 * @param {number} days
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.setRelativeDateRange = function(days) {
  this['relativeDuration'] = true;
  this['startDate'] = new Date();
  this['endDate'] = new Date();
  this['startDate'].setUTCDate(this['startDate'].getUTCDate() - days);
};


/**
 * Start the delay to update the timeline controller.
 *
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.startControllerUpdate_ = function() {
  if (this.updateControllerDelay_) {
    this.updateControllerDelay_.start();
  }
};


/**
 * Updates the start/end date on the timeline controller.
 *
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.updateController_ = function() {
  if (this.tlc_) {
    // convert local dates to utc before setting timeline controller values
    var utcStart = os.time.toUTCDate(this['startDate']);
    var utcEnd = this.getControllerEndDate();
    var startTime = utcStart.getTime();
    var endTime = utcEnd.getTime();

    this.tlc_.setSuppressShowEvents(true);
    this.tlc_.setRange(this.tlc_.buildRange(startTime, endTime));
    this.tlc_.setDuration(this['duration']);
    this.tlc_.setOffset(this.tlc_.getSmallestAnimateRangeLength());
    this.tlc_.setSuppressShowEvents(false);
    this.tlc_.setCurrent(endTime);
  }
};


/**
 * Change handler for duration chooser.
 *
 * @param {number} direction
 * @export
 */
os.ui.datetime.DateControlCtrl.prototype.shiftDate = function(direction) {
  var modifier = 1;
  if (!this['disabled']) {
    if (this['duration'] === os.time.Duration.CUSTOM) {
      // For custom durations, multiply the offset by the difference in days between the start and end dates
      const millisecondsPerDay = 1000 * 60 * 60 * 24;
      modifier = (this['endDate'] - this['startDate']) / millisecondsPerDay;
    }
    this['startDate'] = os.time.offset(this['startDate'], this['duration'], direction * modifier, true);
    this['endDate'] = os.time.offset(this['endDate'], this['duration'], direction * modifier, true);
  }
};


/**
 * Enables the date control to update the timeline controller.
 */
os.ui.datetime.DateControlCtrl.prototype.assumeControl = function() {
  if (this.tlc_) {
    this.tlc_.stop();
    this.tlc_.clearSliceRanges();
    this.updateController_();
  }

  this['disabled'] = false;
};


/**
 * Suspends the date control from updating the timeline controller.
 */
os.ui.datetime.DateControlCtrl.prototype.releaseControl = function() {
  this['disabled'] = true;
};


/**
 * Updates the control from the timeline controller.
 */
os.ui.datetime.DateControlCtrl.prototype.update = function() {
  if (this.tlc_) {
    this['startDate'] = os.time.toLocalDate(new Date(this.tlc_.getStart()));
    this['endDate'] = this.getUIEndDate();
    this['duration'] = this.getDuration();

    os.ui.apply(this.scope_);
  }
};


/**
 * Get the duration from the timeline controller.
 *
 * @return {string} The duration, or `os.time.Duration.DAY` if the timeline controller is not available.
 * @protected
 */
os.ui.datetime.DateControlCtrl.prototype.getDuration = function() {
  return this.tlc_ ? this.tlc_.getDuration() : os.time.Duration.DAY;
};


/**
 * Get the end date from the UI to set in the timeline controller.
 *
 * @return {Date} The end date.
 * @protected
 */
os.ui.datetime.DateControlCtrl.prototype.getControllerEndDate = function() {
  var endDate = os.time.toUTCDate(this['endDate']);
  if (this['duration'] === os.time.Duration.CUSTOM) {
    endDate.setDate(endDate.getDate() + 1);
  }

  return endDate;
};


/**
 * Get the end date from the timeline controller to display in the UI.
 *
 * @return {Date} The end date.
 * @protected
 */
os.ui.datetime.DateControlCtrl.prototype.getUIEndDate = function() {
  if (this.tlc_) {
    var endDate = os.time.toLocalDate(new Date(this.tlc_.getEnd()));

    if (this['duration'] === os.time.Duration.CUSTOM) {
      endDate.setDate(endDate.getDate() - 1);
    }

    return endDate;
  }

  return null;
};


/**
 * Handler for timeline reset.
 *
 * @param {os.time.TimelineControllerEvent} event
 * @private
 */
os.ui.datetime.DateControlCtrl.prototype.onTimelineReset_ = function(event) {
  this.update();
};
