goog.provide('os.ui.LegendButtonCtrl');
goog.provide('os.ui.legendButtonDirective');

goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.menu.MenuButtonCtrl');

/**
 * The add data button bar directive
 * @return {angular.Directive}
 */
os.ui.legendButtonDirective = function() {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    controller: os.ui.LegendButtonCtrl,
    controllerAs: 'ctrl',
    template: '<button class="btn btn-secondary" title="View Legend"' +
      ' ng-click="ctrl.toggle()"' +
      ' ng-class="{active: ctrl.isWindowActive()}">' +
      '<i class="fa fa-map-signs"></i>' +
      '</button>'
  };
};


/**
 * add the directive to the module
 */
os.ui.Module.directive('legendButton', [os.ui.legendButtonDirective]);


/**
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element The element
 * @extends {os.ui.menu.MenuButtonCtrl}
 * @constructor
 * @ngInject
 */
os.ui.LegendButtonCtrl = function($scope, $element) {
  os.ui.LegendButtonCtrl.base(this, 'constructor', $scope, $element);
  this.flag = os.legend.ID;
  this.metricKey = os.metrics.keys.Map.SHOW_LEGEND;
};
goog.inherits(os.ui.LegendButtonCtrl, os.ui.menu.MenuButtonCtrl);
