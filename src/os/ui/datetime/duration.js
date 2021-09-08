goog.module('os.ui.datetime.DurationUI');

goog.require('os.ui.SpinnerUI');
goog.require('os.ui.util.ValidationMessageUI');

const {isEmpty} = goog.require('goog.object');
const {toNumber} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');


/**
 * The duration directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'dur': '=?',
    'useSeconds': '<',
    'useMinutes': '<',
    'useHours': '<',
    'useDays': '<',
    'useWeeks': '<',
    'min': '=?',
    'max': '=?',
    'disabled': '=?',
    'isRequired': '=?',
    'short': '=?'
  },
  templateUrl: ROOT + 'views/datetime/duration.html',
  controller: Controller,
  controllerAs: 'durCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'duration';

/**
 * Add the directive to the module.
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller function for the duration directive
 * @unrestricted
 */
class Controller {
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
    this['errors'] = {
      'duration': {
        '$error': {},
        '$dirty': false
      }
    };

    /**
     * @type {number}
     */
    this['maxdays'] = this.scope_['useWeeks'] ? 6 : 1000;

    /**
     * @type {number}
     */
    this['maxhours'] = this.scope_['useDays'] ? 23 : 1000;

    /**
     * @type {number}
     */
    this['maxminutes'] = this.scope_['useHours'] ? 59 : 1000;

    /**
     * @type {number}
     */
    this['maxseconds'] = this.scope_['useMinutes'] ? 59 : 1000;

    /**
     * @type {?boolean}
     */
    this['valid'] = true;

    /**
     * @type {?boolean}
     */
    this['isrequired'] = this.scope_['isRequired'] != null ? this.scope_['isRequired'] : true;

    $scope.$watch('dur', this.onDurationUpdate_.bind(this));
    $scope.$watch('durCtrl.weeks', this.onWeeksChange_.bind(this));
    $scope.$watch('durCtrl.days', this.onDaysChange_.bind(this));
    $scope.$watch('durCtrl.hours', this.onHoursChange_.bind(this));
    $scope.$watch('durCtrl.minutes', this.onMinutesChange_.bind(this));
    $scope.$watch('durCtrl.seconds', this.onSecondsChange_.bind(this));
    $scope.$watch('min', this.calculateTime_.bind(this));
    $scope.$watch('max', this.calculateTime_.bind(this));
    $scope.$watch('disabled', this.calculateTime_.bind(this));
    $scope.$watch('isRequired', this.onIsRequiredChange_.bind(this));
    $scope.$on('$destroy', this.destroy_.bind(this));

    this.calculateTime_();
    this.init_();
  }

  /**
   * Clean up.
   *
   * @private
   */
  destroy_() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Initialize
   *
   * @private
   */
  init_() {
    this['errors']['duration']['$dirty'] = false;
  }

  /**
   * Calculates the time values for each spinner element.
   *
   * @private
   */
  calculateTime_() {
    if (this.scope_) {
      var minDuration = typeof this.scope_['min'] === 'number' ? this.scope_['min'] : parseInt(this.scope_['min'], 10);

      if (!minDuration) {
        minDuration = 0;
      }

      var maxDuration = typeof this.scope_['max'] === 'number' ? this.scope_['max'] : parseInt(this.scope_['max'], 10);

      if (!maxDuration) {
        maxDuration = Infinity;
      }

      var r = toNumber(this.scope_['dur']);
      r < minDuration ? this['errors']['duration']['$error']['minlength'] = true :
        delete this['errors']['duration']['$error']['minlength'];
      r > maxDuration ? this['errors']['duration']['$error']['maxlength'] = true :
        delete this['errors']['duration']['$error']['maxlength'];
      this['valid'] = isEmpty(this['errors']['duration']['$error']) ||
          this.scope_['disabled'] ? true : null;

      if (this.scope_['useWeeks']) {
        this['weeks'] = Math.floor(r / 604800000);
        r = r % 604800000;
      }

      if (this.scope_['useDays']) {
        this['days'] = Math.floor(r / 86400000);
        r = r % 86400000;
      }

      if (this.scope_['useHours']) {
        this['hours'] = Math.floor(r / 3600000);
        r = r % 3600000;
      }

      if (this.scope_['useMinutes']) {
        this['minutes'] = Math.floor(r / 60000);
        r = r % 60000;
      }

      if (this.scope_['useSeconds']) {
        this['seconds'] = Math.floor(r / 1000);
      }
      apply(this.scope_);

      this['errors']['duration']['$dirty'] = true;
    }
  }

  /**
   * @param {number} newVal
   * @param {number} oldVal
   * @private
   */
  onDurationUpdate_(newVal, oldVal) {
    if (newVal != oldVal) {
      this.scope_['dur'] = newVal;
      this.calculateTime_();
    }
  }

  /**
   * Updates the duration value based on the individual segment values. It then calls calculateTime_ again
   * which breaks the duration down into new segments. Doing it this way allows the user to type in, say,
   * 100 minutes without us interfering, and then once they unfocus that spinner, we calculate that it should
   * become 1 hour 40 minutes.
   *
   * @private
   */
  updateDuration_() {
    var dur = 1000 * (this['seconds'] +
        60 * this['minutes'] +
        60 * 60 * this['hours'] +
        60 * 60 * 24 * this['days'] +
        60 * 60 * 24 * 7 * this['weeks']);

    if (this.scope_['dur'] != dur) {
      this.scope_['dur'] = dur;
      this.calculateTime_();
    }
  }

  /**
   * Handler for week changes.
   *
   * @param {number} value
   * @private
   */
  onWeeksChange_(value) {
    this['weeks'] = value;
    this.updateDuration_();
  }

  /**
   * Handler for day changes.
   *
   * @param {number} value
   * @private
   */
  onDaysChange_(value) {
    this['days'] = value;
    this.updateDuration_();
  }

  /**
   * Handler for hour changes.
   *
   * @param {number} value
   * @private
   */
  onHoursChange_(value) {
    this['hours'] = value;
    this.updateDuration_();
  }

  /**
   * Handler for minute changes.
   *
   * @param {number} value
   * @private
   */
  onMinutesChange_(value) {
    this['minutes'] = value;
    this.updateDuration_();
  }

  /**
   * Handler for second changes.
   *
   * @param {number} value
   * @private
   */
  onSecondsChange_(value) {
    this['seconds'] = value;
    this.updateDuration_();
  }

  /**
   * Handler for required changes.
   *
   * @param {boolean} value
   * @private
   */
  onIsRequiredChange_(value) {
    if (value != null) {
      this['isrequired'] = value;
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
