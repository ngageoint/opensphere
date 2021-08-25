goog.module('os.ui.StateButtonUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const menu = goog.require('os.ui.state.menu');


/**
 * The window button directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'state-button';

/**
 * add the directive to the module
 */
Module.directive('stateButton', [directive]);

/**
 * Controller function for the nav-top directive
 * @unrestricted
 */
class Controller extends MenuButtonCtrl {
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

exports = {
  Controller,
  directive,
  directiveTag
};
