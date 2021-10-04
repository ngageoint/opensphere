goog.declareModuleId('os.ui.SaveButtonUI');

import MenuButtonCtrl from './menu/menubutton.js';
import Module from './module.js';
import * as stateMenu from './state/statemenu.js';


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
  template: '<button class="btn btn-primary dropdown-toggle o-save-button" ng-click="ctrl.openMenu()"' +
    ' title="Save options" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
    ' <i class="fa fa-floppy-o" ng-class="{\'fa-fw\': puny}"></i> <span ng-class="{\'d-none\': puny}">Save</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'save-button';

/**
 * Add the directive to the module
 */
Module.directive('saveButton', [directive]);

/**
 * Controller function for the save-button directive
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
    this.menu = stateMenu.getMenu();
  }
}
