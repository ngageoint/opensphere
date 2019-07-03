goog.provide('os.ui.datetime.DateCustomCtrl');
goog.provide('os.ui.datetime.dateCustomDirective');

goog.require('goog.Disposable');
goog.require('goog.async.Delay');
goog.require('os.time');
goog.require('os.time.Duration');
goog.require('os.time.TimeRange');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.wheelDateDirective');


/**
 * The date-custom directive.
 *
 * @return {angular.Directive}
 */
os.ui.datetime.dateCustomDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'startDate': '=',
      'endDate': '=',
      'disabled': '=?'
    },
    templateUrl: os.ROOT + 'views/datetime/datecustom.html',
    controller: os.ui.datetime.DateCustomCtrl,
    controllerAs: 'dateCustom'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('dateCustom', [os.ui.datetime.dateCustomDirective]);



/**
 * Controller for the date-custom directive.
 * Start date will have time set to 00:00:00z, and end date will have a time of 23:59:59z.
 *
 * @param {!angular.Scope} $scope The Angular scope.
 * @extends {goog.Disposable}
 * @constructor
 * @ngInject
 */
os.ui.datetime.DateCustomCtrl = function($scope) {
  /**
   * The Angular scope.
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * The current duration choice.
   * @type {string}
   */
  this['duration'] = this.scope_['endDate'] || this.scope_['startDate']
    ? os.time.Duration.CUSTOM : os.time.Duration.DAY;

  /**
   * The end date. Inclusive, so time will be 23:59:59z.
   * @type {Date}
   */
  this.scope_['endDate'] = this.scope_['endDate'] ? this.scope_['endDate'] : new Date();

  // set the end time to 23:59:59z
  this.scope_['endDate'] = this.getEndTime_(this.scope_['endDate']);

  /**
   * The start date.  Time will be 00:00:00z.
   * @type {Date}
   */
  this.scope_['startDate'] = this.scope_['startDate'] &&
    this.scope_['startDate'].getTime() <= this.scope_['endDate'].getTime()
    ? this.scope_['startDate'] : os.time.floor(this.scope_['endDate'], os.time.Duration.DAY, true);

  // set the start time to 00:00:00z.
  this.scope_['startDate'] = this.getStartTime_(this.scope_['startDate']);

  /**
   * Available duration choices in the UI.
   * @type {!Array<string>}
   */
  this['durations'] = [
    os.time.Duration.DAY,
    os.time.Duration.WEEK,
    os.time.Duration.MONTH,
    os.time.Duration.CUSTOM
  ];

  // watch for changes to start/end dates
  $scope.$watch('startDate', this.onStartDateChanged_.bind(this));
  $scope.$watch('endDate', this.onEndDateChanged_.bind(this));

  $scope.$on('$destroy', this.dispose.bind(this));
};
goog.inherits(os.ui.datetime.DateCustomCtrl, goog.Disposable);


/**
 * @inheritDoc
 */
os.ui.datetime.DateCustomCtrl.prototype.disposeInternal = function() {
  os.ui.datetime.DateCustomCtrl.base(this, 'disposeInternal');

  this.scope_ = null;
};


/**
 * Change handler for the start date.
 *
 * @param {?Date} newVal The new value.
 * @param {?Date} oldVal The old value.
 * @private
 */
os.ui.datetime.DateCustomCtrl.prototype.onStartDateChanged_ = function(newVal, oldVal) {
  // only compare the dates, not the times
  if (newVal && oldVal && os.time.floor(newVal, os.time.Duration.DAY, true).getTime() !=
      os.time.floor(oldVal, os.time.Duration.DAY, true).getTime()) {
    // set start date time to 00:00:00z
    this.scope_['startDate'] = this.getStartTime_(newVal, this['duration']);

    if (this['duration'] === os.time.Duration.CUSTOM) {
      if (this.scope_['startDate'] >= this.scope_['endDate']) {
        // set end date to start date and time to 23:59:59z
        this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate']);
      }
    } else {
      // set the end date from the start date
      this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate'], this['duration']);
    }
  }
};


/**
 * Change handler for the end date.
 *
 * @param {?Date} newVal The new value.
 * @param {?Date} oldVal The old value.
 * @private
 */
os.ui.datetime.DateCustomCtrl.prototype.onEndDateChanged_ = function(newVal, oldVal) {
  // only compare the dates, not the times
  if (newVal && oldVal && os.time.floor(newVal, os.time.Duration.DAY, true).getTime() !=
      os.time.floor(oldVal, os.time.Duration.DAY, true).getTime()) {
    // set end date time to 23:59:59z
    this.scope_['endDate'] = this.getEndTime_(this.scope_['endDate']);

    if (this.scope_['startDate'] >= this.scope_['endDate']) {
      // set start date to end date and time to 00:00:00z
      this.scope_['startDate'] = this.getStartTime_(this.scope_['endDate']);
    }
  }
};


/**
 * Returns offset date with the time set to 00:00:00z.
 *
 * @param {Date} date The date to set the time for.
 * @param {string=} opt_duration The duration to offset the date.  Defaults to os.time.Duration.DAY.
 * @return {Date} Offset date with a time of 00:00:00z.
 * @private
 */
os.ui.datetime.DateCustomCtrl.prototype.getStartTime_ = function(date, opt_duration) {
  var duration = opt_duration ? opt_duration : os.time.Duration.DAY;
  return os.time.floor(date, duration, true);
};


/**
 * Returns offset date with the time set to 23:59:59z.
 *
 * @param {Date} date The date to set the time for.
 * @param {string=} opt_duration The duration to offset the date.  Defaults to os.time.Duration.DAY.
 * @return {Date} Offset date with a time of 23:59:59z.
 * @private
 */
os.ui.datetime.DateCustomCtrl.prototype.getEndTime_ = function(date, opt_duration) {
  var duration = opt_duration ? opt_duration : os.time.Duration.DAY;

  var newDate = os.time.offset(date, duration, 1, true);
  newDate = os.time.floor(newDate, duration, true);
  return new Date(newDate.getTime() - 1);
};


/**
 * Change handler for duration chooser.
 *
 * @export
 */
os.ui.datetime.DateCustomCtrl.prototype.onDurationChanged = function() {
  this.scope_['startDate'] = this.getStartTime_(this.scope_['startDate'], this['duration']);

  if (this['duration'] === os.time.Duration.CUSTOM) {
    this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate']);
  } else {
    this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate'], this['duration']);
  }
};


/**
 * Change handler for duration chooser.
 *
 * @param {number} direction
 * @export
 */
os.ui.datetime.DateCustomCtrl.prototype.shiftDate = function(direction) {
  this.scope_['startDate'] = os.time.offset(this.scope_['startDate'], this['duration'], direction, true);
  this.scope_['endDate'] = os.time.offset(this.scope_['endDate'], this['duration'], direction, true);
};
