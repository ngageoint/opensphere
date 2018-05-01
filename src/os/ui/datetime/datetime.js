goog.provide('os.ui.datetime.DateTimeCtrl');
goog.provide('os.ui.datetime.dateTimeDirective');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.ui.Module');
goog.require('os.ui.datetime.wheelDateDirective');


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
os.ui.datetime.dateTimeDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'value': '=',
      'disabled': '=?',
      'isRequired': '=?',
      'invalid': '=?',
      'hidecontrols': '=?'
    },
    templateUrl: os.ROOT + 'views/datetime/datetime.html',
    controller: os.ui.datetime.DateTimeCtrl,
    controllerAs: 'dateTimeCtrl'
  };
};


/**
 * Register date-time directive.
 */
os.ui.Module.directive('dateTime', [os.ui.datetime.dateTimeDirective]);



/**
 * Controller function for the date-time directive.
 * @constructor
 * @param {!angular.Scope} $scope
 * @ngInject
 */
os.ui.datetime.DateTimeCtrl = function($scope) {
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
};


/**
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.datetime.DateTimeCtrl.LOGGER_ = goog.log.getLogger('os.ui.datetime.DateTimeCtrl');


/**
 * Clear references to Angular/DOM elements.
 * @private
 */
os.ui.datetime.DateTimeCtrl.prototype.destroy_ = function() {
  this['date'] = null;
  this.scope_ = null;
};


/**
 * Change handler for date picker.
 * @private
 */
os.ui.datetime.DateTimeCtrl.prototype.watchDate_ = function() {
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
};


/**
 * Change handler for date picker.
 * @param {?Date} newVal
 * @param {?Date} oldVal
 * @private
 */
os.ui.datetime.DateTimeCtrl.prototype.onDateChanged_ = function(newVal, oldVal) {
  if (newVal != oldVal) {
    this.updateValue('date');
  }
};


/**
 * Updates the scope value or reports an error.
 * @param {string=} opt_type
 */
os.ui.datetime.DateTimeCtrl.prototype.updateValue = function(opt_type) {
  goog.log.fine(os.ui.datetime.DateTimeCtrl.LOGGER_, 'dateTime.updateValue');

  // if the date was set, zero out any hour/min/sec fields that aren't set yet
  if (opt_type && opt_type === 'date' && goog.isDateLike(this['date'])) {
    if (!goog.isDefAndNotNull(this['hour'])) {
      this['hour'] = 0;
    }
    if (!goog.isDefAndNotNull(this['minute'])) {
      this['minute'] = 0;
    }
    if (!goog.isDefAndNotNull(this['second'])) {
      this['second'] = 0;
    }
  }

  if (goog.isDateLike(this['date']) && goog.isDefAndNotNull(this['hour']) && goog.isDefAndNotNull(this['minute']) &&
      goog.isDefAndNotNull(this['second'])) {
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
    if (this.scope_['required'] && !goog.isDateLike(this['date']) && !goog.isDefAndNotNull(this['hour']) &&
        !goog.isDefAndNotNull(this['minute']) && !goog.isDefAndNotNull(this['second'])) {
      this['requiredString'] = 'Required!';
    } else if (!goog.isDateLike(this['date'])) {
      this['errorString'] = 'Please provide a valid date.';
    } else if (!goog.isDefAndNotNull(this['hour'])) {
      this['errorString'] = 'Hour field invalid! Range: 0-23';
    } else if (!goog.isDefAndNotNull(this['minute'])) {
      this['errorString'] = 'Minute field invalid! Range: 0-59';
    } else if (!goog.isDefAndNotNull(this['second'])) {
      this['errorString'] = 'Second field invalid! Range: 0-59';
    }
  }
};
goog.exportProperty(os.ui.datetime.DateTimeCtrl.prototype, 'updateValue',
    os.ui.datetime.DateTimeCtrl.prototype.updateValue);


/**
 * Sets this field to the current time.
 */
os.ui.datetime.DateTimeCtrl.prototype.setNow = function() {
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
};
goog.exportProperty(os.ui.datetime.DateTimeCtrl.prototype, 'setNow',
    os.ui.datetime.DateTimeCtrl.prototype.setNow);


/**
 * Sets this field to the current time.
 */
os.ui.datetime.DateTimeCtrl.prototype.reset = function() {
  this.unwatchDate_();
  this['date'] = null;
  this['hour'] = null;
  this['minute'] = null;
  this['second'] = null;
  this.scope_['value'] = null;
  this['errorString'] = null;
  this.scope_['invalid'] = false;
  this.watchDate_();
};
goog.exportProperty(os.ui.datetime.DateTimeCtrl.prototype, 'reset',
    os.ui.datetime.DateTimeCtrl.prototype.reset);
