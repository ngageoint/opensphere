goog.declareModuleId('plugin.basemap.TerrainNodeUI');

import Module from '../../os/ui/module.js';
import {Controller as DefaultLayerNodeUICtrl} from '../../os/ui/node/defaultlayernodeui.js';

const DisplaySetting = goog.require('os.config.DisplaySetting');
const Settings = goog.require('os.config.Settings');


/**
 * @type {string}
 */
const template =
  '<span ng-if="nodeUi.show()" class="d-flex flex-shrink-0">' +
    '<span ng-if="nodeUi.isRemovable()" ng-click="nodeUi.remove()">' +
      '<i class="fa fa-times fa-fw c-glyph" title="Remove the terrain layer"></i></span>' +
    '</span>' +
  '</span>';


/**
 * The terrain layer node UI.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: template,
  controller: Controller,
  controllerAs: 'nodeUi'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'terrainnodeui';


/**
 * Add the directive to the module.
 */
Module.directive('terrainnodeui', [directive]);



/**
 * Controller for the terrain layer node UI.
 * @unrestricted
 */
export class Controller extends DefaultLayerNodeUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    super($scope, $element);
  }

  /**
   * Remove the terrain layer.
   *
   * @override
   * @export
   */
  remove() {
    // remove the layer via setting change
    Settings.getInstance().set(DisplaySetting.ENABLE_TERRAIN, false);
  }
}
