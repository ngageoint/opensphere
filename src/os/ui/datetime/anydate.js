goog.provide('os.ui.datetime.AnyDateCtrl');
goog.provide('os.ui.datetime.AnyDateType');
goog.provide('os.ui.datetime.anyDateDirective');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.dateTimeDirective');


/**
 * The anydate directive. This directive provides controls for choosing between no time, time instant, or time range
 * with support for unbounded ranges.
 *
 * Scope vars:
 *  - initialstart: The initial start date or time instant to use.
 *  - initialend: The initial end date to use.
 *  - initialtype: The initial time type to use. Should be one of {@link os.ui.datetime.AnyDateType} values.
 *  - disabled: A boolean indicating an ancestor is performing an action that should disable the form.
 *
 * @return {angular.Directive}
 */
os.ui.datetime.anyDateDirective = function() {
  return {
    restrict: 'E',
    scope: {
      'initialStart': '=initialstart',
      'initialEnd': '=initialend',
      'initialType': '=initialtype',
      'disabled': '=?'
    },
    templateUrl: os.ROOT + 'views/datetime/anydate.html',
    controller: os.ui.datetime.AnyDateCtrl,
    controllerAs: 'anydate'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('anydate', [os.ui.datetime.anyDateDirective]);


/**
 * @enum {string}
 */
os.ui.datetime.AnyDateType = {
  NOTIME: 'notime',
  INSTANT: 'instant',
  RANGE: 'range'
};



/**
 * Controller for the anydate directive.
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @param {!angular.$timeout} $timeout
 * @constructor
 * @ngInject
 */
os.ui.datetime.AnyDateCtrl = function($scope, $element, $compile, $timeout) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {string}
   */
  this['dateType'] = $scope['initialType'] || os.ui.datetime.AnyDateType.NOTIME;

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
  this['startUnknown'] = this['dateType'] == os.ui.datetime.AnyDateType.RANGE && !this['startDate'];

  /**
   * @type {boolean}
   */
  this['endUnknown'] = this['dateType'] == os.ui.datetime.AnyDateType.RANGE && !this['endDate'];

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
      if ($scope['anyDateForm']['startDate']) {
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
      if ($scope['anyDateForm']['endDate']) {
        var modelCtrl = /** @type {angular.NgModelController} */ ($scope['anyDateForm']['endDate']);
        modelCtrl.$setViewValue(newVal);
        modelCtrl.$setDirty();
      }

      this.validateTimes_();
      this.fireDateChange_();
    }
  }.bind(this));

  $scope.$on('resetForm', function() {
    this['dateType'] = os.ui.datetime.AnyDateType.NOTIME;
    this['startDate'] = null;
    this['endDate'] = null;
    this['startUnknown'] = false;
    this['endUnknown'] = false;
  }.bind(this));

  this.validateTimes_();
  $scope.$on('$destroy', this.destroy_.bind(this));
};


/**
 * Change event type.
 * @type {string}
 * @const
 */
os.ui.datetime.AnyDateCtrl.CHANGE = 'anydate:change';


/**
 * Clean up references/listeners.
 * @private
 */
os.ui.datetime.AnyDateCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
};


/**
 * Fire an event notifying the parent of a date change.
 * @private
 */
os.ui.datetime.AnyDateCtrl.prototype.fireDateChange_ = function() {
  switch (this['dateType']) {
    case os.ui.datetime.AnyDateType.NOTIME:
      this.scope_.$emit(os.ui.datetime.AnyDateCtrl.CHANGE, null, null, null);
      break;
    case os.ui.datetime.AnyDateType.INSTANT:
      this.scope_.$emit(os.ui.datetime.AnyDateCtrl.CHANGE, this['startDate'], null, null);
      break;
    case os.ui.datetime.AnyDateType.RANGE:
      if (this['startDate'] != null && this['endDate'] == null && !this['startUnknown'] && !this['endUnknown']) {
        // default the end date to the end of the start datetime
        var tmpStr = this['startDate'].split('T');
        tmpStr = tmpStr[0] + 'T23:59:59Z';
        this['endDate'] = tmpStr;
      }

      this.scope_.$emit(os.ui.datetime.AnyDateCtrl.CHANGE, null,
          this['startUnknown'] ? null : this['startDate'],
          this['endUnknown'] ? null : this['endDate']);
      break;
    default:
      this.scope_.$emit(os.ui.datetime.AnyDateCtrl.CHANGE, null, null, null);
      break;
  }
};


/**
 * Make sure the provided times are valid.
 * @private
 */
os.ui.datetime.AnyDateCtrl.prototype.validateTimes_ = function() {
  if (this['dateType'] == os.ui.datetime.AnyDateType.RANGE && this['startDate'] && this['endDate'] &&
      !this['startUnknown'] && !this['endUnknown']) {
    var startDate = new Date(this['startDate']).getTime();
    var endDate = new Date(this['endDate']).getTime();
    this['timesValid'] = (endDate >= startDate) ? true : undefined;
  } else {
    this['timesValid'] = true;
  }
};
