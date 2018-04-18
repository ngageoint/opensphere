goog.provide('os.ui.alert.AlertButtonCtrl');
goog.provide('os.ui.alert.alertButtonDirective');

goog.require('os.ui.MenuButtonCtrl');
goog.require('os.ui.Module');
goog.require('os.ui.alert.alertBadgeDirective');


/**
 * The alert button directive
 * @return {angular.Directive}
 */
os.ui.alert.alertButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.alert.AlertButtonCtrl,
    controllerAs: 'ctrl',
    template: '<span>' +
      '<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="Alerts"' +
      ' ng-class="{\'active\': ctrl.isWindowActive()}">' +
      '<i class="fa fa-bell"></i>' +
      '</button>' +
      '<alertbadge reset="ctrl.isWindowActive()"></alertbadge>' +
      '</span>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('alertButton', [os.ui.alert.alertButtonDirective]);



/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.alert.AlertButtonCtrl = function($scope, $element) {
  os.ui.alert.AlertButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'alerts';
};
goog.inherits(os.ui.alert.AlertButtonCtrl, os.ui.MenuButtonCtrl);
