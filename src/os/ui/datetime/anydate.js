goog.module('os.ui.datetime.AnyDateUI');

goog.require('os.ui.datetime.DateTimeUI');

const {ROOT} = goog.require('os');
const Module = goog.require('os.ui.Module');
const AnyDateType = goog.require('os.ui.datetime.AnyDateType');

const AnyDateHelp = goog.requireType('os.ui.datetime.AnyDateHelp');


/**
 * The anydate directive. This directive provides controls for choosing between no time, time instant, or time range
 * with support for unbounded ranges.
 *
 * Scope vars:
 *  - initialstart: The initial start date or time instant to use.
 *  - initialend: The initial end date to use.
 *  - initialtype: The initial time type to use. Should be one of {@link AnyDateType} values.
 *  - disabled: A boolean indicating an ancestor is performing an action that should disable the form.
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'initialStart': '=initialstart',
    'initialEnd': '=initialend',
    'initialType': '=initialtype',
    'disabled': '=?',
    'help': '=?'
  },
  templateUrl: ROOT + 'views/datetime/anydate.html',
  controller: Controller,
  controllerAs: 'anydate'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'anydate';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the anydate directive.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $compile, $timeout) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {string}
     */
    this['dateType'] = $scope['initialType'] || AnyDateType.INSTANT;

    /**
     * @type {boolean}
     */
    this['timesValid'] = true;

    /**
     * @type {?string}
     */
    this['startDate'] = $scope['initialStart'] || null;

    /**
     * @type {?string}
     */
    this['endDate'] = $scope['initialEnd'] || null;

    /**
     * @type {boolean}
     */
    this['startUnknown'] = this['dateType'] == AnyDateType.RANGE && !this['startDate'];

    /**
     * @type {boolean}
     */
    this['endUnknown'] = this['dateType'] == AnyDateType.RANGE && !this['endDate'];

    /**
     * @type {AnyDateHelp|undefined}
     */
    this['help'] = this.scope_['help'];

    $scope.$watch('anydate.dateType', function(newVal, oldVal) {
      if (newVal != oldVal) {
        this['startUnknown'] = false;
        this['endUnknown'] = false;

        this.validateTimes_();
        this.fireDateChange_();
      }
    }.bind(this));

    $scope.$watch('anydate.startUnknown', function(newVal, oldVal) {
      if (newVal != oldVal) {
        if (newVal) {
          this['endUnknown'] = false;
        }

        this.validateTimes_();
        this.fireDateChange_();
      }
    }.bind(this));

    $scope.$watch('anydate.endUnknown', function(newVal, oldVal) {
      if (newVal != oldVal) {
        if (newVal) {
          this['startUnknown'] = false;
        }

        this.validateTimes_();
        this.fireDateChange_();
      }
    }.bind(this));

    $scope.$watch('anydate.startDate', function(newVal, oldVal) {
      if (newVal != oldVal) {
        // If the form doesnt have the input, dont set data on it. It gets initialized correctly when displayed
        if ($scope['anyDateForm'] && $scope['anyDateForm']['startDate']) {
          var modelCtrl = /** @type {angular.NgModelController} */ ($scope['anyDateForm']['startDate']);
          modelCtrl.$setViewValue(newVal);
          modelCtrl.$setDirty();
        }

        this.validateTimes_();
        this.fireDateChange_();
      }
    }.bind(this));

    $scope.$watch('anydate.endDate', function(newVal, oldVal) {
      if (newVal != oldVal) {
        // If the form doesnt have the input, dont set data on it. It gets initialized correctly when displayed
        if ($scope['anyDateForm'] && $scope['anyDateForm']['endDate']) {
          var modelCtrl = /** @type {angular.NgModelController} */ ($scope['anyDateForm']['endDate']);
          modelCtrl.$setViewValue(newVal);
          modelCtrl.$setDirty();
        }

        this.validateTimes_();
        this.fireDateChange_();
      }
    }.bind(this));

    $scope.$on('resetForm', function() {
      this['dateType'] = AnyDateType.NOTIME;
      this['startDate'] = null;
      this['endDate'] = null;
      this['startUnknown'] = false;
      this['endUnknown'] = false;
    }.bind(this));

    this.validateTimes_();
    $scope.$on('$destroy', this.destroy_.bind(this));
  }

  /**
   * Clean up references/listeners.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
  }

  /**
   * Fire an event notifying the parent of a date change.
   *
   * @private
   */
  fireDateChange_() {
    switch (this['dateType']) {
      case AnyDateType.NOTIME:
        this.scope_.$emit(Controller.CHANGE, null, null, null);
        break;
      case AnyDateType.INSTANT:
        this.scope_.$emit(Controller.CHANGE, this['startDate'], null, null);
        break;
      case AnyDateType.RANGE:
        if (this['startDate'] != null && this['endDate'] == null && !this['startUnknown'] && !this['endUnknown']) {
          // default the end date to the end of the start datetime
          var tmpStr = this['startDate'].split('T');
          tmpStr = tmpStr[0] + 'T23:59:59Z';
          this['endDate'] = tmpStr;
        }

        this.scope_.$emit(Controller.CHANGE, null,
            this['startUnknown'] ? null : this['startDate'],
            this['endUnknown'] ? null : this['endDate']);
        break;
      default:
        this.scope_.$emit(Controller.CHANGE, null, null, null);
        break;
    }
  }

  /**
   * Make sure the provided times are valid.
   *
   * @private
   */
  validateTimes_() {
    if (this['dateType'] == AnyDateType.RANGE && this['startDate'] && this['endDate'] &&
        !this['startUnknown'] && !this['endUnknown']) {
      var startDate = new Date(this['startDate']).getTime();
      var endDate = new Date(this['endDate']).getTime();
      this['timesValid'] = (endDate > startDate) ? true : undefined;
    } else {
      this['timesValid'] = true;
    }
  }
}

/**
 * Change event type.
 * @type {string}
 * @const
 */
Controller.CHANGE = 'anydate:change';

exports = {
  Controller,
  directive,
  directiveTag
};
