goog.declareModuleId('os.ui.filter.BetweenUI');

import './coltypecheckvalidation.js';
import {ROOT} from '../../os.js';
import Module from '../module.js';


/**
 * The default between literal directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/filter/between.html',
  controller: Controller,
  controllerAs: 'betweenCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'fb-between';

/**
 * Add the directive to the module
 */
Module.directive('fbBetween', [directive]);

/**
 * Controller for the between UI
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

    this['min'] = 0;
    this['max'] = 1;

    if ($scope['expr']['literal'] != null) {
      var nums = $scope['expr']['literal'].split(/\s*,\s*/);

      if (nums.length == 2) {
        this['min'] = parseFloat(nums[0]);
        this['max'] = parseFloat(nums[1]);
      }
    }

    this.onChange();
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * clean up
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Run when the user changes the value
   *
   * @export
   */
  onChange() {
    var a = parseFloat(this['min']);
    var b = parseFloat(this['max']);
    var val = '';

    if (!isNaN(a)) {
      val += a + ', ';
    }

    if (!isNaN(b)) {
      val += b;
    }

    this.scope_['expr']['literal'] = val;
  }
}
