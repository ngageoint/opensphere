goog.provide('os.ui.SliderCtrl');
goog.provide('os.ui.sliderDirective');
goog.require('os.ui.Module');


/**
 * A slider directive
 * @return {angular.Directive}
 */
os.ui.sliderDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'live': '&',
      'min': '=',
      'max': '=',
      'name': '@',
      'value': '=',
      'step': '=',
      'disabled': '=?'
    },
    template: '<div class="slider-container"></div>',
    controller: os.ui.SliderCtrl
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('slider', [os.ui.sliderDirective]);



/**
 * Controller for the slider directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.SliderCtrl = function($scope, $element) {
  var options = {
    'min': $scope['min'],
    'max': $scope['max'],
    'value': $scope['value'],
    'disabled': goog.isDef($scope['disabled']) ? $scope['disabled'] : false
  };

  if (goog.isDef($scope['step'])) {
    options['step'] = $scope['step'];
  }

  var liveUpdate = true;
  if (goog.isDef($scope['live']) && goog.isDef($scope['live']())) {
    liveUpdate = $scope['live']();
  }

  if (liveUpdate) {
    // if updating live set the slide callback and the start/stop callbacks
    var slideStartStopBinding = this.onSlideStartStop.bind(this);
    options['slide'] = this.onSlide_.bind(this);
    options['start'] = slideStartStopBinding;
    options['stop'] = slideStartStopBinding;
  } else {
    // if not live, set only the stop callback
    options['stop'] = this.onSlide_.bind(this);
  }

  $scope.$on('$destroy', this.onDestroy_.bind(this));

  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {?angular.JQLite}
   * @private
   */
  this.element_ = $element;
  this.element_['slider'](options);

  var fn = this.onChange_.bind(this);
  $scope.$watch('disabled', fn);
  $scope.$watch('value', fn);
  $scope.$watch('min', fn);
  $scope.$watch('max', fn);
  $scope.$watch('step', fn);
};


/**
 * Clean up
 * @private
 */
os.ui.SliderCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
  this.element_ = null;
};


/**
 * Handles external changes to value
 * @param {number|Array.<number>} newVal
 * @param {number|Array.<number>} oldVal
 * @private
 */
os.ui.SliderCtrl.prototype.onChange_ = function(newVal, oldVal) {
  if (newVal !== oldVal) {
    var list = ['min', 'max', 'step', 'value', 'disabled'];

    for (var i = 0, n = list.length; i < n; i++) {
      var key = list[i];

      if (key in this.scope_) {
        this.element_['slider']('option', key, this.scope_[key]);
      }
    }
  }
};


/**
 * Handles slide event
 * @param {*} e The event
 * @param {*} slider The slider
 * @private
 */
os.ui.SliderCtrl.prototype.onSlide_ = function(e, slider) {
  var bounds = this.getBounds_(slider);

  if (bounds) {
    var value = bounds.length === 1 ? bounds[0] : bounds;
    this.scope_['value'] = value;
    this.scope_.$emit(this.scope_['name'] + '.' + e.type, value);

    os.ui.apply(this.scope_);
  }
};


/**
 * Handles slidestart/stop when in live update mode.
 * @param {*} e The event
 * @param {*} slider The slider
 * @protected
 */
os.ui.SliderCtrl.prototype.onSlideStartStop = function(e, slider) {
  var value = this.scope_['value'];
  this.scope_.$emit(this.scope_['name'] + '.' + e.type, value);
};


/**
 * Gets the bounds for the given slider
 * @param {*} slider
 * @return {!Array.<number>} The slider values as [lower, upper]
 * @private
 */
os.ui.SliderCtrl.prototype.getBounds_ = function(slider) {
  if ('values' in slider) {
    var values = slider['values'];
    var a = values[0];
    var b = values[1];
    return [Math.min(a, b), Math.max(a, b)];
  }

  return [slider['value']];
};
