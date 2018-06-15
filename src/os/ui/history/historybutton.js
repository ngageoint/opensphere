goog.provide('os.ui.history.HistoryButtonCtrl');
goog.provide('os.ui.history.historyButtonDirective');

goog.require('os.ui.MenuButtonCtrl');
goog.require('os.ui.Module');
goog.require('os.ui.history.historyViewDirective');


/**
 * The alert button directive
 * @return {angular.Directive}
 */
os.ui.history.historyButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.history.HistoryButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="History"' +
      ' ng-class="{\'active\': ctrl.isWindowActive()}">' +
      '<i class="fa fa-fw fa-history"></i>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('historyButton', [os.ui.history.historyButtonDirective]);



/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.history.HistoryButtonCtrl = function($scope, $element) {
  os.ui.history.HistoryButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'history';
};
goog.inherits(os.ui.history.HistoryButtonCtrl, os.ui.MenuButtonCtrl);
