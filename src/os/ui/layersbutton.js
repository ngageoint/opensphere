goog.provide('os.ui.LayersButtonCtrl');
goog.provide('os.ui.layersButtonDirective');

goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');

/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.layersButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.LayersButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-primary" title="View Layers"' +
      ' ng-click="ctrl.toggle()"' +
      ' ng-class="{active: ctrl.isWindowActive()}">' +
      '<i class="fa fa-align-justify"></i> <span ng-class="{\'d-none\': puny}">Layers</span>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('layersButton', [os.ui.layersButtonDirective]);


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.LayersButtonCtrl = function($scope, $element) {
  os.ui.LayersButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = 'layers';
  this.metricKey = os.metrics.keys.Map.SHOW_LAYER_WINDOW;
};
goog.inherits(os.ui.LayersButtonCtrl, os.ui.menu.MenuButtonCtrl);
