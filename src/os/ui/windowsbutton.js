goog.declareModuleId('os.ui.WindowsButtonUI');

import MenuButtonCtrl from './menu/menubutton.js';
import * as windows from './menu/windowsmenu.js';
import Module from './module.js';


/**
 * The windows button directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary dropdown-toggle" ng-click="ctrl.openMenu()"' +
    ' title="Windows and other views" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
    'More' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'windows-button';

/**
 * add the directive to the module
 */
Module.directive('windowsButton', [directive]);

/**
 * Controller function for the nav-top directive
 * @unrestricted
 */
export class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element The element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
    this.menu = windows.getMenu();
  }
}
