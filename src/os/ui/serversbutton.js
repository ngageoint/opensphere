goog.provide('os.ui.ServersButtonCtrl');
goog.provide('os.ui.serversButtonDirective');

goog.require('os.ui.MenuButtonCtrl');
goog.require('os.ui.Module');


/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.serversButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.ServersButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()" title="Servers"' +
      ' ng-class="{\'active\': ctrl.isWindowActive(\'settings\')}">' +
      '<i class="fa fa-fw fa-database"></i> <span ng-class="{\'d-none\': puny}">Servers</span>' +
      '<span ng-if="serverError" class="ml-1 badge badge-warning"><i class="fa fa-fw fa-warning"></i></span>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('serversButton', [os.ui.serversButtonDirective]);



/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.ServersButtonCtrl = function($scope, $element) {
  os.ui.ServersButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'servers';

  os.dataManager.listen(os.data.DataProviderEventType.LOADED, this.checkServerError_, false, this);
  os.dataManager.listen(os.data.DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
  os.dataManager.listen(os.data.DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);
};
goog.inherits(os.ui.ServersButtonCtrl, os.ui.MenuButtonCtrl);


/**
 * @inheritDoc
 */
os.ui.ServersButtonCtrl.prototype.onDestroy = function() {
  os.ui.ServersButtonCtrl.base(this, 'onDestroy');

  os.dataManager.unlisten(os.data.DataProviderEventType.LOADED, this.checkServerError_, false, this);
  os.dataManager.unlisten(os.data.DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
  os.dataManager.unlisten(os.data.DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);
};


/**
 * Check if any enabled providers encountered an error while loading and display a message to the user if it hasn't
 * already been seen.
 * @private
 */
os.ui.ServersButtonCtrl.prototype.checkServerError_ = function() {
  if (this.scope) {
    this.scope['serverError'] = os.dataManager.hasError();
    os.ui.apply(this.scope);
  }
};


