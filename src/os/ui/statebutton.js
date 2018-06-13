goog.provide('os.ui.StateButtonCtrl');
goog.provide('os.ui.stateButtonDirective');

goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.state.menu');

/**
 * The window button directive
 * @return {angular.Directive}
 */
os.ui.stateButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.StateButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary dropdown-toggle o-state-button" ng-click="ctrl.openMenu()"' +
      ' title="State options" ng-right-click="ctrl.openMenu()" ng-class="{active: menu}">' +
      ' <i class="fa fa-bookmark"></i> <span ng-class="{\'d-none\': puny}">States</span>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('stateButton', [os.ui.stateButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.StateButtonCtrl = function($scope, $element) {
  os.ui.StateButtonCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.state.MENU;
};
goog.inherits(os.ui.StateButtonCtrl, os.ui.menu.MenuButtonCtrl);
