goog.provide('os.ui.SpinnerCtrl');
goog.provide('os.ui.spinnerDirective');
goog.require('os.ui.Module');


/**
 * A spinner directive
 *
 * @return {angular.Directive}
 */
os.ui.spinnerDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'live': '&',
      'disabled': '=?',
      'min': '=?',
      'max': '=?',
      'name': '@',
      'value': '=',
      'step': '=?',
      'css': '@'
    },
    template: '<div ng-form><input class="spinner" name="spinner"/></div>',
    controller: os.ui.SpinnerCtrl
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('spinner', [os.ui.spinnerDirective]);



/**
 * Controller for spinner directive
 *
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.SpinnerCtrl = function($scope, $element) {
  var liveUpdate = true;

  if ($scope['live'] !== undefined && $scope['live']() !== undefined) {
    liveUpdate = $scope['live']();
  }

  if ($scope['min'] == null) {
    $scope['min'] = -Infinity;
  }

  if ($scope['max'] == null) {
    $scope['max'] = Infinity;
  }

  var options = {
    'change': this.onSpinnerChange_.bind(this),
    'min': $scope['min'],
    'max': $scope['max'],
    'value': $scope['value'],
    'start': this.killEvent_
  };

  if ($scope['step'] !== undefined) {
    options['step'] = $scope['step'];
  }

  options[liveUpdate ? 'spin' : 'stop'] = this.onSpin_.bind(this);
  if (!options['spin']) {
    options['spin'] = this.killEvent_;
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  this.spinner_ = $element.find('input');
  this.spinner_.spinner(options);

  if ($scope['css']) {
    $element.find('.ui-spinner').addClass($scope['css']);
  }
  $element.find('.ui-spinner-input').addClass('form-control');

  var fn = this.onChange_.bind(this);
  $scope.$watch('value', fn);
  $scope.$watch('min', fn);
  $scope.$watch('max', fn);
  $scope.$watch('step', fn);

  $scope.$watch('disabled', this.onDisabledChange_.bind(this));
};


/**
 * Clean up
 *
 * @private
 */
os.ui.SpinnerCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
  this.spinner_ = null;
};


/**
 * Default event handler to prevent mouse wheel events from leaving the spinner.
 *
 * @param {*} e The mouse event to stop
 * @private
 */
os.ui.SpinnerCtrl.prototype.killEvent_ = function(e) {
  e.stopPropagation();
};


/**
 * Handles external changes to other values
 *
 * @param {number} newVal
 * @param {number} oldVal
 * @private
 */
os.ui.SpinnerCtrl.prototype.onChange_ = function(newVal, oldVal) {
  var list = ['min', 'max', 'step'];

  for (var i = 0, n = list.length; i < n; i++) {
    var key = list[i];

    if (key in this.scope_) {
      this.spinner_.spinner('option', key, this.scope_[key]);
    }
  }

  if (this.scope_['value'] === null) {
    this.scope_['value'] = this.scope_['min'] || 0;
  }

  this.spinner_.spinner('value', this.scope_['value']);

  if (newVal !== oldVal && this.scope_['name'] && this.scope_[this.scope_['name']]) {
    this.scope_[this.scope_['name']].$setDirty();
  }
};


/**
 * Handles changes to the disabled scope value.
 *
 * @param {boolean=} opt_new
 * @param {boolean=} opt_old
 * @private
 */
os.ui.SpinnerCtrl.prototype.onDisabledChange_ = function(opt_new, opt_old) {
  if (opt_new !== undefined) {
    this.spinner_.spinner('option', 'disabled', opt_new);
  }
};


/**
 * Handles the spin event
 *
 * @param {*} e The event
 * @param {*} spinner The spinner
 * @private
 */
os.ui.SpinnerCtrl.prototype.onSpin_ = function(e, spinner) {
  // jQuery UI manages the value between max and min so we don't need to
  this.killEvent_(e);

  var faceValue = spinner['value'] !== undefined ? spinner['value'] : this.spinner_.spinner('value');
  this.scope_['value'] = faceValue;
  this.scope_.$emit(this.scope_['name'] + '.' + e.type, faceValue);
  os.ui.apply(this.scope_);
};


/**
 * Handles the spinner change event
 *
 * @param {*} e The event
 * @param {*} spinner The spinner
 * @private
 */
os.ui.SpinnerCtrl.prototype.onSpinnerChange_ = function(e, spinner) {
  var faceValue = spinner['value'] !== undefined ? spinner['value'] : this.spinner_.spinner('value');
  if (typeof faceValue !== 'number') {
    faceValue = this.scope_['value'];
  }

  var adjustedValue = goog.math.clamp(faceValue, this.scope_['min'], this.scope_['max']);
  if (adjustedValue != this.scope_['value'] || faceValue != adjustedValue) {
    this.scope_['value'] = adjustedValue;
    this.scope_.$emit(this.scope_['name'] + '.' + e.type, adjustedValue);
    os.ui.apply(this.scope_);
  }

  // Ensure ui matches angular's scope
  if (this.spinner_.spinner('value') != this.scope_['value']) {
    this.spinner_.spinner('value', this.scope_['value']);
  }
};
