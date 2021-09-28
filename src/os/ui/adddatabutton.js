goog.declareModuleId('os.ui.AddDataButtonUI');

import * as dispatcher from '../dispatcher.js';
import {AddData} from '../metrics/metricskeys.js';
import ImportEventType from './im/importeventtype.js';
import * as osUiMenuImport from './menu/importmenu.js';
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
  template: '<div class="btn-group o-add-data-button" ng-right-click="ctrl.openMenu()">' +
    '<button class="btn btn-success" id="addDataButton" title="Add data to the map"' +
    ' ng-click="ctrl.toggle()"' +
    ' ng-class="{active: ctrl.isWindowActive()}" metric="{{metrics.addDataOpen}}">' +
    '<i class="fa fa-plus" ng-class="{\'fa-fw\': puny}"></i> <span ng-class="{\'d-none\': puny}">Add Data</span>' +
    '</button>' +
    '<button class="btn btn-success" title="Open a file or URL" ng-click="ctrl.open()">' +
    '<i class="fa fa-fw fa-folder-open"></i>' +
    '</button>' +
    '<button class="btn btn-success dropdown-toggle dropdown-toggle-split" ng-click="ctrl.openMenu()"' +
    ' ng-class="{active: menu}">' +
    '</button></div>'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'add-data-button';

/**
 * add the directive to the module
 */
Module.directive('addDataButton', [directive]);

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
    this.menu = osUiMenuImport.getMenu();
    this.flag = 'addData';
    this.metricKey = AddData.OPEN;
  }

  /**
   * Opens a file or URL
   *
   * @export
   */
  open() {
    dispatcher.getInstance().dispatchEvent(ImportEventType.FILE);
  }
}
