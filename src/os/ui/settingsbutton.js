goog.module('os.ui.SettingsButtonUI');
goog.module.declareLegacyNamespace();

const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');


/**
 * The add data button bar directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary" title="Modify map settings such as projection and units"' +
    ' ng-click="ctrl.toggle()"' +
    ' ng-class="{active: ctrl.isWindowActive()}">' +
    '<i class="fa fa-gears"></i> ' +
    '<span ng-class="{\'d-none\': puny}">Settings</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'settings-button';

/**
 * add the directive to the module
 */
Module.directive('settingsButton', [directive]);

/**
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
    this.flag = 'settings';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
