goog.module('os.ui.LayersButtonUI');
goog.module.declareLegacyNamespace();

const {Map: MapKeys} = goog.require('os.metrics.keys');
const Module = goog.require('os.ui.Module');
const MenuButtonCtrl = goog.require('os.ui.menu.MenuButtonCtrl');


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
  template: '<button class="btn btn-primary" title="View Layers"' +
    ' ng-click="ctrl.toggle()"' +
    ' ng-class="{active: ctrl.isWindowActive()}">' +
    '<i class="fa fa-layer-group" ng-class="{\'fa-fw\': puny}"></i> ' +
    '<span ng-class="{\'d-none\': puny}">Layers</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'layers-button';

/**
 * add the directive to the module
 */
Module.directive('layersButton', [directive]);

/**
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
    this.flag = 'layers';
    this.metricKey = MapKeys.SHOW_LAYER_WINDOW;
  }
}

exports = {
  Controller,
  directive,
  directiveTag
};
