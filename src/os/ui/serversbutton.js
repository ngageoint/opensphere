goog.module('os.ui.ServersButtonUI');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const DataProviderEventType = goog.require('os.data.DataProviderEventType');
const {apply} = goog.require('os.ui');
const MenuButtonCtrl = goog.require('os.ui.MenuButtonCtrl');
const Module = goog.require('os.ui.Module');


/**
 * The add data button bar directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary" ng-click="ctrl.toggle()"' +
    ' title="Add, remove, edit, and toggle data servers"' +
    ' ng-class="{\'active\': ctrl.isWindowActive(\'settings\')}">' +
    '<i class="fa fa-fw fa-database"></i> ' +
    '<span ng-class="{\'d-none\': puny}">Servers</span>' +
    '<span ng-if="serverError" class="ml-1 badge badge-warning"><i class="fa fa-fw fa-warning"></i></span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'servers-button';

/**
 * add the directive to the module
 */
Module.directive('serversButton', [directive]);

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
    this.flag = 'servers';

    DataManager.getInstance().listen(DataProviderEventType.LOADED, this.checkServerError_, false, this);
    DataManager.getInstance().listen(DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
    DataManager.getInstance().listen(DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);
  }

  /**
   * @inheritDoc
   */
  onDestroy() {
    super.onDestroy();

    DataManager.getInstance().unlisten(DataProviderEventType.LOADED, this.checkServerError_, false, this);
    DataManager.getInstance().unlisten(DataProviderEventType.EDIT_PROVIDER, this.checkServerError_, false, this);
    DataManager.getInstance().unlisten(DataProviderEventType.REMOVE_PROVIDER, this.checkServerError_, false, this);
  }

  /**
   * Check if any enabled providers encountered an error while loading and display a message to the user if it hasn't
   * already been seen.
   *
   * @private
   */
  checkServerError_() {
    if (this.scope) {
      this.scope['serverError'] = DataManager.getInstance().hasError();
      apply(this.scope);
    }
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
