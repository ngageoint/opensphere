goog.declareModuleId('os.ui.columnactions.ColumnActionsUI');

import {ROOT} from '../../os.js';
import Module from '../module.js';
import {close} from '../window.js';


/**
 * Dialog used when a user tries importing a duplicate file.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  transclude: true,
  templateUrl: ROOT + 'views/columnactions/columnactionprompt.html',
  controller: Controller,
  controllerAs: 'columnActionPrompt'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'columnactions';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the File Exists! window
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

    /**
     * @type {?angular.JQLite}
     * @private
     */
    this.element_ = $element;

    this['matched'] = this.scope_['matched'];
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.element_ = null;
    this.scope_ = null;
  }

  /**
   *
   * @param {Object} match
   * @param {string} value
   * @export
   */
  executeMatch(match, value) {
    match.execute(value);
  }

  /**
   *
   * @param {Object} match
   * @return {string}
   * @export
   */
  getDescription(match) {
    return match.getDescription();
  }

  /**
   * Close the window.
   *
   * @export
   */
  close() {
    close(this.element_);
  }
}
