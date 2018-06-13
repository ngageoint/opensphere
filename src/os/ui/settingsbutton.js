goog.provide('os.ui.SettingsButtonCtrl');
goog.provide('os.ui.settingsButtonDirective');

goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');

/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.settingsButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.SettingsButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary" title="View Settings"' +
      ' ng-click="ctrl.toggle()"' +
      ' ng-class="{active: ctrl.isWindowActive()}">' +
      '<i class="fa fa-gears"></i> <span ng-class="{\'d-none\': puny}">Settings</span>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('settingsButton', [os.ui.settingsButtonDirective]);


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.SettingsButtonCtrl = function($scope, $element) {
  os.ui.SettingsButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'settings';
};
goog.inherits(os.ui.SettingsButtonCtrl, os.ui.menu.MenuButtonCtrl);
