goog.declareModuleId('os.ui.datetime.DateCustomUI');

import './wheeldate.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';

const Disposable = goog.require('goog.Disposable');
const time = goog.require('os.time');
const Duration = goog.require('os.time.Duration');


/**
 * The date-custom directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'startDate': '=',
    'endDate': '=',
    'disabled': '=?'
  },
  templateUrl: ROOT + 'views/datetime/datecustom.html',
  controller: Controller,
  controllerAs: 'dateCustom'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'date-custom';

/**
 * Add the directive to the module.
 */
Module.directive('dateCustom', [directive]);

/**
 * Controller for the date-custom directive.
 * Start date will have time set to 00:00:00z, and end date will have a time of 23:59:59z.
 * @unrestricted
 */
export class Controller extends Disposable {
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
     * The current duration choice.
     * @type {string}
     */
    this['duration'] = this.scope_['endDate'] || this.scope_['startDate'] ?
      Duration.CUSTOM : Duration.DAY;

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
      this.scope_['startDate'].getTime() <= this.scope_['endDate'].getTime() ?
      this.scope_['startDate'] : time.floor(this.scope_['endDate'], Duration.DAY, true);

    // set the start time to 00:00:00z.
    this.scope_['startDate'] = this.getStartTime_(this.scope_['startDate']);

    /**
     * Available duration choices in the UI.
     * @type {!Array<string>}
     */
    this['durations'] = [
      Duration.DAY,
      Duration.WEEK,
      Duration.MONTH,
      Duration.CUSTOM
    ];

    // watch for changes to start/end dates
    $scope.$watch('startDate', this.onStartDateChanged_.bind(this));
    $scope.$watch('endDate', this.onEndDateChanged_.bind(this));

    $scope.$on('$destroy', this.dispose.bind(this));
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.scope_ = null;
  }

  /**
   * Change handler for the start date.
   *
   * @param {?Date} newVal The new value.
   * @param {?Date} oldVal The old value.
   * @private
   */
  onStartDateChanged_(newVal, oldVal) {
    // only compare the dates, not the times
    if (newVal && oldVal && time.floor(newVal, Duration.DAY, true).getTime() !=
        time.floor(oldVal, Duration.DAY, true).getTime()) {
      // set start date time to 00:00:00z
      this.scope_['startDate'] = this.getStartTime_(newVal, this['duration']);

      if (this['duration'] === Duration.CUSTOM) {
        if (this.scope_['startDate'] >= this.scope_['endDate']) {
          // set end date to start date and time to 23:59:59z
          this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate']);
        }
      } else {
        // set the end date from the start date
        this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate'], this['duration']);
      }
    }
  }

  /**
   * Change handler for the end date.
   *
   * @param {?Date} newVal The new value.
   * @param {?Date} oldVal The old value.
   * @private
   */
  onEndDateChanged_(newVal, oldVal) {
    // only compare the dates, not the times
    if (newVal && oldVal && time.floor(newVal, Duration.DAY, true).getTime() !=
        time.floor(oldVal, Duration.DAY, true).getTime()) {
      // set end date time to 23:59:59z
      this.scope_['endDate'] = this.getEndTime_(this.scope_['endDate']);

      if (this.scope_['startDate'] >= this.scope_['endDate']) {
        // set start date to end date and time to 00:00:00z
        this.scope_['startDate'] = this.getStartTime_(this.scope_['endDate']);
      }
    }
  }

  /**
   * Returns offset date with the time set to 00:00:00z.
   *
   * @param {Date} date The date to set the time for.
   * @param {string=} opt_duration The duration to offset the date.  Defaults to Duration.DAY.
   * @return {Date} Offset date with a time of 00:00:00z.
   * @private
   */
  getStartTime_(date, opt_duration) {
    var duration = opt_duration ? opt_duration : Duration.DAY;
    return time.floor(date, duration, true);
  }

  /**
   * Returns offset date with the time set to 23:59:59z.
   *
   * @param {Date} date The date to set the time for.
   * @param {string=} opt_duration The duration to offset the date.  Defaults to Duration.DAY.
   * @return {Date} Offset date with a time of 23:59:59z.
   * @private
   */
  getEndTime_(date, opt_duration) {
    var duration = opt_duration ? opt_duration : Duration.DAY;

    var newDate = time.offset(date, duration, 1, true);
    newDate = time.floor(newDate, duration, true);
    return new Date(newDate.getTime() - 1);
  }

  /**
   * Change handler for duration chooser.
   *
   * @export
   */
  onDurationChanged() {
    this.scope_['startDate'] = this.getStartTime_(this.scope_['startDate'], this['duration']);

    if (this['duration'] === Duration.CUSTOM) {
      this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate']);
    } else {
      this.scope_['endDate'] = this.getEndTime_(this.scope_['startDate'], this['duration']);
    }
  }

  /**
   * Change handler for duration chooser.
   *
   * @param {number} direction
   * @export
   */
  shiftDate(direction) {
    this.scope_['startDate'] = time.offset(this.scope_['startDate'], this['duration'], direction, true);
    this.scope_['endDate'] = time.offset(this.scope_['endDate'], this['duration'], direction, true);
  }
}
