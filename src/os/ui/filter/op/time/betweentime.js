goog.declareModuleId('os.ui.filter.op.time.BetweenTimeUI');

import '../../../datetime/duration.js';
import '../../../popover/popover.js';
import {ROOT} from '../../../../os.js';
import Module from '../../../module.js';


/**
 * The between time directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/filter/op/time/betweentime.html',
  controller: Controller,
  controllerAs: 'betweenTimeCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'betweentime';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the betweentime directive
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
     * @type {number}
     */
    this['min'] = 0;

    /**
     * @type {number}
     */
    this['max'] = 60000;

    if ($scope['expr']['literal'] != null) {
      var nums = $scope['expr']['literal'].split(/\s*,\s*/);

      if (nums.length == 2) {
        this['min'] = parseFloat(nums[0]);
        this['max'] = parseFloat(nums[1]);
      }
    }

    this.update(this['min'], this['max']);

    $scope.$watch('betweenTimeCtrl.min', this.onMinChange.bind(this));
    $scope.$watch('betweenTimeCtrl.max', this.onMaxChange.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Watcher for minimum value changes.
   *
   * @param {number} newVal The new minimum value.
   * @param {number} oldVal The old minimum value.
   * @export
   */
  onMinChange(newVal, oldVal) {
    this.update(newVal, this['max']);
  }

  /**
   * Watcher for maximum value changes.
   *
   * @param {number} newVal The new maximum value.
   * @param {number} oldVal The old maximum value.
   * @export
   */
  onMaxChange(newVal, oldVal) {
    this.update(this['min'], newVal);
  }

  /**
   * Update the literal value.
   *
   * @param {number} min The maximum value to set.
   * @param {number} max The minimum value to set.
   */
  update(min, max) {
    var val = '';

    if (!isNaN(min)) {
      val += min + ', ';
    }

    if (!isNaN(max)) {
      val += max;
    }

    this.scope_['expr']['literal'] = val;
  }
}
