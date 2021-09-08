goog.module('os.ui.ScaleLine');

const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');
const unitMenu = goog.require('os.ui.menu.unit');


/**
 * Controller for the scale line directive.
 */
class Controller extends MenuButtonCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);

    this.menu = unitMenu.MENU;
    this.btnPosition = 'right top';
    this.menuPosition = 'right bottom-4';
  }
}

/**
 * The scale line directive.
 * @return {angular.Directive}
 */
const directive = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    template: '<li class="pointer js-menu__toggle" id="scale-line" ' +
      'ng-click="ctrl.openMenu()" ng-right-click="ctrl.openMenu()">' +
      '<div class="unit-group"></div></li>',
    controller: Controller,
    controllerAs: 'ctrl'
  };
};

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'scale-line';

/**
 * Add the directive to the module.
 */
Module.directive('scaleLine', [directive]);

exports = {
  Controller,
  directive,
  directiveTag
};
