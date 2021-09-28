goog.declareModuleId('os.ui.LegendButtonUI');

import {ID} from '../legend/legend.js';
import {Map as MapKeys} from '../metrics/metricskeys.js';
import MenuButtonCtrl from './menu/menubutton.js';
import Module from './module.js';


/**
 * The add data button bar directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'E',
  replace: true,
  scope: true,
  controller: Controller,
  controllerAs: 'ctrl',
  template: '<button class="btn btn-secondary" title="View the map legend"' +
    ' ng-click="ctrl.toggle()"' +
    ' ng-class="{active: ctrl.isWindowActive()}">' +
    '<i class="fa fa-map-signs"></i> ' +
    '<span ng-class="{\'d-none\': puny}">Legend</span>' +
    '</button>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'legend-button';

/**
 * add the directive to the module
 */
Module.directive('legendButton', [directive]);

/**
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
    this.flag = ID;
    this.metricKey = MapKeys.SHOW_LEGEND;
  }
}
