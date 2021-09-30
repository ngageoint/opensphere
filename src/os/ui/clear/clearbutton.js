goog.module('os.ui.clear.ClearButtonUI');

const MenuButtonCtrl = goog.require('os.ui.MenuButtonCtrl');
const Module = goog.require('os.ui.Module');


/**
 * The clear directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()" ' +
      'title="Select items to clear/reset">' +
      '<i class="fa fa-fw fa-times"></i>' +
      '<span ng-class="{\'d-none\': puny}">Clear</span>' +
      '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'clear-button';

/**
 * add the directive to the module
 */
Module.directive('clearButton', [directive]);

/**
 * Controller function for the nav-top directive
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
    this.flag = 'clear';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
