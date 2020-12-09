goog.module('os.ui.history.HistoryButtonUI');
goog.module.declareLegacyNamespace();

const MenuButtonCtrl = goog.require('os.ui.MenuButtonCtrl');
const Module = goog.require('os.ui.Module');


goog.require('os.ui.historyDirective');

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

  template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="History"' +
    ' ng-class="{\'active\': ctrl.isWindowActive()}">' +
    '<i class="fa fa-fw fa-history"></i>' +
    '</button>'
});


/**
 * add the directive to the module
 */
Module.directive('historyButton', [directive]);



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
    this.flag = 'history';
  }
}

exports = {
  Controller,
  directive
};
