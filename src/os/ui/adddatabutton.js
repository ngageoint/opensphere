goog.provide('os.ui.AddDataButtonCtrl');
goog.provide('os.ui.addDataButtonDirective');

goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.im.ImportEventType');
goog.require('os.ui.menu.MenuButtonCtrl');
goog.require('os.ui.menu.import');

/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.addDataButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: {
      'showLabel': '='
    },
    controller: os.ui.AddDataButtonCtrl,
    controllerAs: 'ctrl',
    template: '<div class="add-data-group btn-group" ng-right-click="ctrl.openMenu()">' +
      '<button class="btn btn-default" id="addDataButton" title="Add data to the map"' +
      ' ng-click="ctrl.toggle()"' +
      ' ng-class="{active: ctrl.isWindowActive()}" metric="{{metrics.addDataOpen}}">' +
      '<i class="fa fa-plus green-icon"></i> {{showLabel ? \'Add Data\' : \'\'}}' +
      '</button>' +
      '<button class="btn btn-default" title="Open a file or URL" ng-click="ctrl.open()">' +
      '<i class="fa fa-folder-open"></i>' +
      '</button>' +
      '<button class="btn addon" ng-click="ctrl.openMenu()"' +
      ' ng-class="{active: menu}">' +
      '<i class="fa fa-chevron-down"></i>' +
      '</button></div>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('addDataButton', [os.ui.addDataButtonDirective]);


/**
 * Controller function for the nav-top directive
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.AddDataButtonCtrl = function($scope, $element) {
  os.ui.AddDataButtonCtrl.base(this, 'constructor', $scope, $element);
  this.menu = os.ui.menu.import.MENU;
  this.flag = 'addData';
  this.metricKey = os.metrics.keys.AddData.OPEN;
};
goog.inherits(os.ui.AddDataButtonCtrl, os.ui.menu.MenuButtonCtrl);

/**
 * Opens a file or URL
 */
os.ui.AddDataButtonCtrl.prototype.open = function() {
  os.dispatcher.dispatchEvent(os.ui.im.ImportEventType.FILE);
};
goog.exportProperty(os.ui.AddDataButtonCtrl.prototype, 'open', os.ui.AddDataButtonCtrl.prototype.open);


