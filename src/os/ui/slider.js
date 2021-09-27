goog.declareModuleId('os.ui.SliderUI');

import Module from './module.js';
import {apply} from './ui.js';


/**
 * A slider directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
  controller: Controller
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'slider';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the slider directive
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    var options = {
      'min': $scope['min'],
      'max': $scope['max'],
      'value': $scope['value'],
      'disabled': $scope['disabled'] !== undefined ? $scope['disabled'] : false
    };

    if ($scope['step'] !== undefined) {
      options['step'] = $scope['step'];
    }

    var liveUpdate = true;
    if ($scope['live'] !== undefined && $scope['live']() !== undefined) {
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
  }

  /**
   * Clean up
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
    this.element_ = null;
  }

  /**
   * Handles external changes to value
   *
   * @param {number|Array<number>} newVal
   * @param {number|Array<number>} oldVal
   * @private
   */
  onChange_(newVal, oldVal) {
    if (newVal !== oldVal) {
      var list = ['min', 'max', 'step', 'value', 'disabled'];

      for (var i = 0, n = list.length; i < n; i++) {
        var key = list[i];

        if (key in this.scope_) {
          this.element_['slider']('option', key, this.scope_[key]);
        }
      }
    }
  }

  /**
   * Handles slide event
   *
   * @param {*} e The event
   * @param {*} slider The slider
   * @private
   */
  onSlide_(e, slider) {
    var bounds = this.getBounds_(slider);

    if (bounds) {
      var value = bounds.length === 1 ? bounds[0] : bounds;
      this.scope_['value'] = value;
      this.scope_.$emit(this.scope_['name'] + '.' + e.type, value);

      apply(this.scope_);
    }
  }

  /**
   * Handles slidestart/stop when in live update mode.
   *
   * @param {*} e The event
   * @param {*} slider The slider
   * @protected
   */
  onSlideStartStop(e, slider) {
    var value = this.scope_['value'];
    this.scope_.$emit(this.scope_['name'] + '.' + e.type, value);
  }

  /**
   * Gets the bounds for the given slider
   *
   * @param {*} slider
   * @return {!Array<number>} The slider values as [lower, upper]
   * @private
   */
  getBounds_(slider) {
    if ('values' in slider) {
      var values = slider['values'];
      var a = values[0];
      var b = values[1];
      return [Math.min(a, b), Math.max(a, b)];
    }

    return [slider['value']];
  }
}
