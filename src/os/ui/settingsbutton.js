goog.declareModuleId('os.ui.SettingsButtonUI');

import MenuButtonCtrl from './menu/menubutton.js';
import Module from './module.js';


/**
 * The add data button bar directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
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
export const directiveTag = 'settings-button';

/**
 * add the directive to the module
 */
Module.directive('settingsButton', [directive]);

/**
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
    this.flag = 'settings';
  }
}
