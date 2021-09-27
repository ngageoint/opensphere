goog.declareModuleId('os.ui.clear.ClearButtonUI');

import MenuButtonCtrl from '../menubutton.js';
import Module from '../module.js';


/**
 * The clear directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-danger" ng-click="ctrl.toggle()" ' +
      'title="Select items to clear/reset">' +
      '<i class="fa fa-fw fa-times"></i>' +
      '<span ng-class="{\'d-none\': puny}">Clear</span>' +
      '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'clear-button';

/**
 * add the directive to the module
 */
Module.directive('clearButton', [directive]);

/**
 * Controller function for the nav-top directive
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
    this.flag = 'clear';
  }
}
