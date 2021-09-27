goog.declareModuleId('os.ui.StateButtonUI');

import MenuButtonCtrl from './menu/menubutton.js';
import Module from './module.js';
import * as menu from './state/statemenu.js';


/**
 * The window button directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary dropdown-toggle o-state-button" ng-click="ctrl.openMenu()"' +
    ' title="State options" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
    ' <i class="fa fa-bookmark" ng-class="{\'fa-fw\': puny}"></i> <span ng-class="{\'d-none\': puny}">States</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'state-button';

/**
 * add the directive to the module
 */
Module.directive('stateButton', [directive]);

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
    this.menu = menu.getMenu();
  }
}
