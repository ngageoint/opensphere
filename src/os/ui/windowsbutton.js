goog.module('os.ui.WindowsButtonUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const windows = goog.require('os.ui.menu.windows');


/**
 * The windows button directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'windows-button';

/**
 * add the directive to the module
 */
Module.directive('windowsButton', [directive]);

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
    this.menu = windows.MENU;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
