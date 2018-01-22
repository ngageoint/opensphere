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
    scope: {
      'showLabel': '='
    },
    controller: os.ui.StateButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-default btn-menu no-text" ng-click="ctrl.openMenu()"' +
      ' title="State options" ng-right-click="ctrl.openMenu()">' +
      ' <i class="fa fa-bookmark yellow-icon"></i> {{showLabel ? \'States\' : \'\'}}' +
      ' <i class="fa fa-chevron-down menu-arrow"></i>' +
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
