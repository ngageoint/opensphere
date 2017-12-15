goog.provide('os.ui.ScaleLineCtrl');
goog.provide('os.ui.scaleLineDirective');

goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.unit');


/**
 * The scale line directive
 * @return {angular.Directive}
 */
os.ui.scaleLineDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: '<li class="pointer" id="scale-line" ng-click="ctrl.openMenu()" ng-right-click="ctrl.openMenu()">' +
        '<div class="unit-group"></div></li>',
    controller: os.ui.ScaleLineCtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module.
 */
os.ui.Module.directive('scaleLine', [os.ui.scaleLineDirective]);



/**
 * Controller function for the scale line directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.ScaleLineCtrl = function($scope, $element) {
  os.ui.ScaleLineCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.menu.UNIT;
  this.btnPosition = 'right top';
  this.menuPosition = 'right bottom-4';
};
goog.inherits(os.ui.ScaleLineCtrl, os.ui.menu.MenuButtonCtrl);
