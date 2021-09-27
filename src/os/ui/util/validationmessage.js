goog.declareModuleId('os.ui.util.ValidationMessageUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';

const {isEmpty} = goog.require('goog.object');


/**
 * A collection of help messages that can be overriden or added to, meant to consolidate messages used in validation
 * Make sure to include the was-valided class at the parent level for these to work!
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: {
    'target': '=',
    'context': '@?'
  },
  templateUrl: ROOT + 'views/util/validationmessage.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'validation-message';

/**
 * Add the directive to the os.ui module
 */
Module.directive('validationMessage', [directive]);

/**
 * Controller for the validation message
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
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;
  }

  /**
   * Waits for Angular to finish doing things then resizes the map.
   *
   * @return {boolean}
   * @export
   */
  hasError() {
    return this.scope_['target'] && !isEmpty(this.scope_['target'].$error) && this.scope_['target'].$dirty;
  }
}
