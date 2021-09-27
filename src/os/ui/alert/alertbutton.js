goog.declareModuleId('os.ui.alert.AlertButtonUI');

import MenuButtonCtrl from '../menubutton.js';
import Module from '../module.js';
import {directiveTag as alertBadgeUi} from './alertbadge.js';


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
  template:
`<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="View past alerts and toggle alert popups"
    ng-class="{'active': ctrl.isWindowActive()}">
  <i class="fa fa-fw fa-bell"></i>
  <span ng-class="{'d-none': puny}">Alerts</span>
  <${alertBadgeUi} reset="ctrl.isWindowActive()"></${alertBadgeUi}>
</button>`
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'alert-button';

/**
 * add the directive to the module
 */
Module.directive('alertButton', [directive]);

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
    this.flag = 'alerts';
  }
}
