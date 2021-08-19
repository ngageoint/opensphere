goog.module('os.ui.alert.AlertButtonUI');
goog.module.declareLegacyNamespace();

const MenuButtonCtrl = goog.require('os.ui.MenuButtonCtrl');
const Module = goog.require('os.ui.Module');
const {directiveTag: alertBadgeUi} = goog.require('os.ui.alert.AlertBadgeUI');


/**
 * The alert button directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
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
const directiveTag = 'alert-button';

/**
 * add the directive to the module
 */
Module.directive('alertButton', [directive]);

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
    this.flag = 'alerts';
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
