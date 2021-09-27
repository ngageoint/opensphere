goog.declareModuleId('os.ui.datetime.DateTimeUI');

import './wheeldate.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';

const log = goog.require('goog.log');
const Logger = goog.requireType('goog.log.Logger');


/**
 * The date-time Directive
 *
 * The scope variables
 * value: The date/time value emitted by the directive
 * disabled:  The enabled/disabled state of the directive
 * isRequired:  Passed to ng-reqired to determine how validation should be handled
 * invalid: The invalid state of the widget as a whole.  The negative to valid is used
 *           since invalid is true on not 0 and false on 0.  This means that it can carry
 *           and pass information such as an error message when invalid or null when not.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'value': '=',
    'disabled': '=?',
    'isRequired': '=?',
    'invalid': '=?',
    'hidecontrols': '=?'
  },
  templateUrl: ROOT + 'views/datetime/datetime.html',
  controller: Controller,
  controllerAs: 'dateTimeCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'date-time';

/**
 * Register date-time directive.
 */
Module.directive('dateTime', [directive]);

/**
 * Controller function for the date-time directive.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @ngInject
   */
  constructor($scope) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {?Date}
     */
    this['date'] = null;

    /**
     * @type {?number}
     */
    this['hour'] = null;

    /**
     * @type {?number}
     */
    this['minute'] = null;

    /**
     * @type {?number}
     */
    this['second'] = null;

    /**
     * @dict
     */
    this['dateOptions'] = {
      'changeYear': true,
      'changeMonth': true,
      'yearRange': '1900:+10'
    };

    $scope['required'] = $scope['isRequired'] || false;

    this.watchDate_();

    $scope.$watch('disabled', function(val, old) {
      if (val === true) {
        $scope['required'] = false;
      } else {
        $scope['required'] = $scope['isRequired'];
      }
    });

    $scope.$watch('isRequired', function(val, old) {
      // If its disabled, not required. Otherwise, check if its required
      $scope['required'] = $scope['disabled'] ? false : $scope['isRequired'];
    });

    $scope.$on('reset', function(event, val) {
      if (val == this.scope_['value']) {
        var initialDate = new Date(this.scope_['value']);
        this['date'] = new Date(initialDate.getTime() + initialDate.getTimezoneOffset() * 60000);
        this['hour'] = initialDate.getUTCHours();
        this['minute'] = initialDate.getUTCMinutes();
        this['second'] = initialDate.getUTCSeconds();
      }
    }.bind(this));

    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clear references to Angular/DOM elements.
   *
   * @private
   */
  destroy_() {
    this['date'] = null;
    this.scope_ = null;
  }

  /**
   * Change handler for date picker.
   *
   * @private
   */
  watchDate_() {
    this.scope_.$watch('value', function(newVal, oldVal) {
      if (newVal) {
        // offset local time so the ui-date control displays in UTC
        var initialDate = new Date(newVal);
        this['date'] = new Date(initialDate.getTime() + initialDate.getTimezoneOffset() * 60000);
        this['hour'] = initialDate.getUTCHours();
        this['minute'] = initialDate.getUTCMinutes();
        this['second'] = initialDate.getUTCSeconds();
      } else {
        this['date'] = null;
        this['hour'] = null;
        this['minute'] = null;
        this['second'] = null;
      }
    }.bind(this));
    this.unwatchDate_ = this.scope_.$watch('dateTimeCtrl.date', this.onDateChanged_.bind(this));
  }

  /**
   * Change handler for date picker.
   *
   * @param {?Date} newVal
   * @param {?Date} oldVal
   * @private
   */
  onDateChanged_(newVal, oldVal) {
    if (newVal && newVal != oldVal) {
      this.updateValue('date');
    }
  }

  /**
   * Updates the scope value or reports an error.
   *
   * @param {string=} opt_type
   * @export
   */
  updateValue(opt_type) {
    log.fine(logger, 'dateTime.updateValue');

    // if the date was set, zero out any hour/min/sec fields that aren't set yet
    if (opt_type && opt_type === 'date' && goog.isDateLike(this['date']) && !isNaN(this['date'].getTime())) {
      if (this['hour'] == null) {
        this['hour'] = 0;
      }
      if (this['minute'] == null) {
        this['minute'] = 0;
      }
      if (this['second'] == null) {
        this['second'] = 0;
      }
    }

    if (goog.isDateLike(this['date']) && !isNaN(this['date'].getTime()) && this['hour'] != null &&
       this['minute'] != null && this['second'] != null) {
      // update date field with hour/min/sec control values
      var utcDate = new Date(this['date'].getTime() - this['date'].getTimezoneOffset() * 60000);
      utcDate.setUTCHours(this['hour']);
      utcDate.setUTCMinutes(this['minute']);
      utcDate.setUTCSeconds(this['second']);

      // convert to ISO string and drop the milliseconds
      this.scope_['value'] = utcDate.toISOString().replace(/\.[0-9]{3}Z/, 'Z');
      this['errorString'] = null;
      this.scope_['invalid'] = false;
    } else {
      this.scope_['invalid'] = true;
      this['errorString'] = null;
      this['requiredString'] = null;
      // display error string for missing/invalid value, preferring date > hour > min > sec
      if (this.scope_['required'] && !goog.isDateLike(this['date']) && this['hour'] == null &&
          this['minute'] == null && this['second'] == null) {
        this['requiredString'] = 'Required!';
      } else if (!goog.isDateLike(this['date'])) {
        this['errorString'] = 'Please provide a valid date.';
      } else if (this['hour'] == null) {
        this['errorString'] = 'Hour field invalid! Range: 0-23';
      } else if (this['minute'] == null) {
        this['errorString'] = 'Minute field invalid! Range: 0-59';
      } else if (this['second'] == null) {
        this['errorString'] = 'Second field invalid! Range: 0-59';
      }
    }
  }

  /**
   * Sets this field to the current time.
   *
   * @export
   */
  setNow() {
    // set the inputs as dirty for validation
    $('.js-date-time__time-input').addClass('ng-dirty');
    $('.js-wheel-date__date-input').addClass('ng-dirty');

    // offset local time so the ui-date control displays in UTC
    var now = new Date();
    this['date'] = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
    this['hour'] = now.getUTCHours();
    this['minute'] = now.getUTCMinutes();
    this['second'] = now.getUTCSeconds();
    this.updateValue();

    if (this.scope_ && this.scope_['dateTimeForm']) {
      this.scope_['dateTimeForm'].$setDirty();
    }
  }

  /**
   * Sets this field to the current time.
   *
   * @export
   */
  reset() {
    this.unwatchDate_();
    this['date'] = null;
    this['hour'] = null;
    this['minute'] = null;
    this['second'] = null;
    this.scope_['value'] = null;
    this['errorString'] = null;
    this.scope_['invalid'] = false;
    this.watchDate_();
  }
}

/**
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.datetime.DateTimeUI');
