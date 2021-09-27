goog.declareModuleId('os.ui.history.HistoryButtonUI');

import MenuButtonCtrl from '../menubutton.js';
import Module from '../module.js';


/**
 * The alert button directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',

  template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="View past map interactions"' +
    ' ng-class="{\'active\': ctrl.isWindowActive()}">' +
    '<i class="fa fa-fw fa-history"></i> ' +
    '<span ng-class="{\'d-none\': puny}">History</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'history-button';

/**
 * add the directive to the module
 */
Module.directive('historyButton', [directive]);

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
    this.flag = 'history';
  }
}
