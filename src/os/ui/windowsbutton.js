goog.provide('os.ui.WindowsButtonCtrl');
goog.provide('os.ui.windowsButtonDirective');

goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.windows');

/**
 * The windows button directive
 * @return {angular.Directive}
 */
os.ui.windowsButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'showLabel': '='
    },
    controller: os.ui.WindowsButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-default btn-menu no-text" ng-click="ctrl.openMenu()"' +
      ' title="Windows and other views" ng-right-click="ctrl.openMenu()">' +
      '<i class="fa fa-clone"></i> {{showLabel ? \'Windows\' : \'\'}}' +
      '&nbsp;<i class="fa fa-chevron-down menu-arrow"></i>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('windowsButton', [os.ui.windowsButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.WindowsButtonCtrl = function($scope, $element) {
  os.ui.WindowsButtonCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.menu.windows.MENU;
};
goog.inherits(os.ui.WindowsButtonCtrl, os.ui.menu.MenuButtonCtrl);
