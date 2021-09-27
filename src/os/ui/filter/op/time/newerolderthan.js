goog.declareModuleId('os.ui.filter.op.time.NewerOlderThanUI');

import '../../../datetime/duration.js';
import '../../../popover/popover.js';
import {ROOT} from '../../../../os.js';
import Module from '../../../module.js';


/**
 * The newerolderthan directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  templateUrl: ROOT + 'views/filter/op/time/newerolderthan.html',
  controller: Controller,
  controllerAs: 'newerOlderThanCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'newerolderthan';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the newerolderthan directive.
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

    var val = parseFloat($scope['expr']['literal']);
    if (val == null || isNaN(val)) {
      // default to 1 minute
      val = 60000;
    }
    /**
     * @type {number}
     */
    this['value'] = val;

    this.onChange(val, val);

    $scope.$watch('newerOlderThanCtrl.value', this.onChange.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
  }

  /**
   * Watcher for maximum duration value changes.
   *
   * @param {number} newVal The new maximum value.
   * @param {number} oldVal The old maximum value.
   * @export
   */
  onChange(newVal, oldVal) {
    var val = '';

    if (!isNaN(newVal)) {
      val += newVal;
    }

    this.scope_['expr']['literal'] = val;
  }
}
