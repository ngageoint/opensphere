goog.provide('os.ui.datetime.DurationCtrl');
goog.provide('os.ui.datetime.durationDirective');
goog.require('os.ui.Module');
goog.require('os.ui.spinnerDirective');


/**
 * The duration directive
 * @return {angular.Directive}
 */
os.ui.datetime.durationDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'dur': '=?',
      'useSeconds': '@',
      'useMinutes': '@',
      'useHours': '@',
      'useDays': '@',
      'useWeeks': '@',
      'min': '=?',
      'max': '=?',
      'disabled': '=?'
    },
    templateUrl: os.ROOT + 'views/datetime/duration.html',
    controller: os.ui.datetime.DurationCtrl,
    controllerAs: 'durCtrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('duration', [os.ui.datetime.durationDirective]);



/**
 * Controller function for the duration directive
 * @param {!angular.Scope} $scope
 * @constructor
 * @ngInject
 */
os.ui.datetime.DurationCtrl = function($scope) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {number}
   * @private
   */
  this.minDuration_ = goog.isNumber($scope['min']) ? $scope['min'] : parseInt($scope['min'], 10);

  if (!this.minDuration_) {
    this.minDuration_ = 0;
  }

  /**
   * @type {number}
   * @private
   */
  this.maxDuration_ = goog.isNumber($scope['max']) ? $scope['max'] : parseInt($scope['max'], 10);

  if (!this.maxDuration_) {
    this.maxDuration_ = Infinity;
  }

  /**
   * @type {number}
   */
  this['weeks'] = 0;

  /**
   * @type {number}
   */
  this['days'] = 0;

  /**
   * @type {number}
   */
  this['hours'] = 0;

  /**
   * @type {number}
   */
  this['minutes'] = 0;

  /**
   * @type {number}
   */
  this['seconds'] = 0;

  /**
   * @type {Object}
   */
  this['errors'] = {};

  /**
   * @type {number}
   */
  this['maxdays'] = this.scope_['useWeeks'] === 'true' ? 6 : 1000;

  /**
   * @type {number}
   */
  this['maxhours'] = this.scope_['useDays'] === 'true' ? 23 : 1000;

  /**
   * @type {number}
   */
  this['maxminutes'] = this.scope_['useHours'] === 'true' ? 59 : 1000;

  /**
   * @type {number}
   */
  this['maxseconds'] = this.scope_['useMinutes'] === 'true' ? 59 : 1000;

  /**
   * @type {?boolean}
   */
  this['valid'] = true;

  $scope.$watch('dur', this.onDurationUpdate_.bind(this));
  $scope.$watch('durCtrl.weeks', this.onWeeksChange_.bind(this));
  $scope.$watch('durCtrl.days', this.onDaysChange_.bind(this));
  $scope.$watch('durCtrl.hours', this.onHoursChange_.bind(this));
  $scope.$watch('durCtrl.minutes', this.onMinutesChange_.bind(this));
  $scope.$watch('durCtrl.seconds', this.onSecondsChange_.bind(this));
  $scope.$on('$destroy', this.destroy_.bind(this));

  this.calculateTime_();
};


/**
 * Clean up.
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.destroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Calculates the time values for each spinner element.
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.calculateTime_ = function() {
  if (this.scope_) {
    var r = goog.string.toNumber(this.scope_['dur']);
    r < this.minDuration_ ? this['errors']['minDuration'] = true : delete this['errors']['minDuration'];
    r > this.maxDuration_ ? this['errors']['maxDuration'] = true : delete this['errors']['maxDuration'];
    this['valid'] = goog.object.isEmpty(this['errors']) ? true : null;

    if (this.scope_['useWeeks'] === 'true') {
      this['weeks'] = Math.floor(r / 604800000);
      r = r % 604800000;
    }

    if (this.scope_['useDays'] === 'true') {
      this['days'] = Math.floor(r / 86400000);
      r = r % 86400000;
    }

    if (this.scope_['useHours'] === 'true') {
      this['hours'] = Math.floor(r / 3600000);
      r = r % 3600000;
    }

    if (this.scope_['useMinutes'] === 'true') {
      this['minutes'] = Math.floor(r / 60000);
      r = r % 60000;
    }

    if (this.scope_['useSeconds'] === 'true') {
      this['seconds'] = Math.floor(r / 1000);
    }
    os.ui.apply(this.scope_);
  }
};


/**
 * @param {number} newVal
 * @param {number} oldVal
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onDurationUpdate_ = function(newVal, oldVal) {
  if (newVal != oldVal) {
    this.scope_['dur'] = newVal;
    this.calculateTime_();
  }
};


/**
 * Updates the duration value based on the individual segment values. It then calls calculateTime_ again
 * which breaks the duration down into new segments. Doing it this way allows the user to type in, say,
 * 100 minutes without us interfering, and then once they unfocus that spinner, we calculate that it should
 * become 1 hour 40 minutes.
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.updateDuration_ = function() {
  var dur = 1000 * (this['seconds'] +
      60 * this['minutes'] +
      60 * 60 * this['hours'] +
      60 * 60 * 24 * this['days'] +
      60 * 60 * 24 * 7 * this['weeks']);

  if (this.scope_['dur'] != dur) {
    this.scope_['dur'] = dur;
    this.calculateTime_();
  }
};


/**
 * Handler for week changes.
 * @param {number} value
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onWeeksChange_ = function(value) {
  this['weeks'] = value;
  this.updateDuration_();
};


/**
 * Handler for day changes.
 * @param {number} value
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onDaysChange_ = function(value) {
  this['days'] = value;
  this.updateDuration_();
};


/**
 * Handler for hour changes.
 * @param {number} value
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onHoursChange_ = function(value) {
  this['hours'] = value;
  this.updateDuration_();
};


/**
 * Handler for minute changes.
 * @param {number} value
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onMinutesChange_ = function(value) {
  this['minutes'] = value;
  this.updateDuration_();
};


/**
 * Handler for second changes.
 * @param {number} value
 * @private
 */
os.ui.datetime.DurationCtrl.prototype.onSecondsChange_ = function(value) {
  this['seconds'] = value;
  this.updateDuration_();
};
