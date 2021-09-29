goog.module('os.ui.SaveButtonUI');

const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const stateMenu = goog.require('os.ui.state.menu');


/**
 * The save button directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'save-button';

/**
 * Add the directive to the module
 */
Module.directive('saveButton', [directive]);

/**
 * Controller function for the save-button directive
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
    this.menu = stateMenu.getMenu();
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
