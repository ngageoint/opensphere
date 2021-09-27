goog.declareModuleId('os.ui.SaveButtonUI');

import MenuButtonCtrl from './menu/menubutton.js';
import * as save from './menu/savemenu.js';
import Module from './module.js';


/**
 * The save button directive
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
    ' title="Save options" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
    '<i class="fa fa-floppy-o" ng-class="{\'fa-fw\': puny}"></i> <span ng-class="{\'d-none\': puny}">Save</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'save-button';

/**
 * add the directive to the module
 */
Module.directive('saveButton', [directive]);

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
    this.menu = save.getMenu();
  }
}
