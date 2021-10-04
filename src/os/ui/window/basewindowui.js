goog.declareModuleId('os.ui.window.BaseWindowUI');

import * as osWindow from '../window.js';
import WindowEvent from '../windoweventtype.js';


/**
 * Base directive for window content. Callers should provide the template/templateUrl, and optionally may override
 * other properties.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  return {
    restrict: 'E',
    replace: true,
    controller: Controller,
    controllerAs: 'ctrl'
  };
};

/**
 * Base controller for window content.
 * @unrestricted
 */
export class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    /**
     * The Angular scope.
     * @type {?angular.Scope}
     * @protected
     */
    this.scope = $scope;

    /**
     * The root DOM element.
     * @type {?angular.JQLite}
     * @protected
     */
    this.element = $element;

    // Fire the window READY event to size/position the window after the window and its children are initialized.
    $timeout(() => {
      this.scope.$emit(WindowEvent.READY);
    });
  }

  /**
   * Close the window
   * @export
   */
  close() {
    osWindow.close(this.element);
  }

  /**
   * Angular $onDestroy lifecycle hook.
   */
  $onDestroy() {
    this.scope = null;
    this.element = null;
  }
}
