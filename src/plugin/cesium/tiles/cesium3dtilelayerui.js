goog.declareModuleId('plugin.cesium.tiles.Cesium3DTileLayerUI');

import '../../../os/ui/slider.js';
import {ROOT} from '../../../os/os.js';

import {Controller as DefaultLayerUICtrl} from '../../../os/ui/layer/defaultlayerui.js';
import Module from '../../../os/ui/module.js';

const {toHexString} = goog.require('os.color');
const LayerColor = goog.require('os.command.LayerColor');
const osImplements = goog.require('os.implements');
const IColorableLayer = goog.require('os.layer.IColorableLayer');

const ICommand = goog.requireType('os.command.ICommand');
const LayerNode = goog.requireType('os.data.LayerNode');
const ILayer = goog.requireType('os.layer.ILayer');


/**
 * Layer controls UI for Cesium 3D tile layers.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/plugin/cesium/cesium3dtile.html',
  controller: Controller,
  controllerAs: 'ctrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'cesium3dtilelayerui';


/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);



/**
 * Controller for the Cesium 3D tile layer UI.
 * @unrestricted
 */
export class Controller extends DefaultLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @param {!angular.$timeout} $timeout The Angular $timeout service.
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    $scope.$on('color.change', this.onColorChange.bind(this));
    $scope.$on('color.reset', this.onColorReset.bind(this));
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope) {
      this.scope['color'] = this.getColor_();
    }
  }

  /**
   * Gets the color from the item(s)
   *
   * @return {?string} a hex color string
   * @private
   */
  getColor_() {
    var items = /** @type {Array<!LayerNode>} */ (this.scope['items']);

    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = items[i].getLayer();
          if (osImplements(layer, IColorableLayer.ID)) {
            var color = /** @type {IColorableLayer} */ (layer).getColor();
            return color ? toHexString(color) : color;
          }
        } catch (e) {
        }
      }
    }

    return null;
  }

  /**
   * Handles changes to color
   *
   * @param {angular.Scope.Event} event
   * @param {string} value
   * @protected
   */
  onColorChange(event, value) {
    var fn =
        /**
         * @param {ILayer} layer
         * @return {ICommand}
         */
        function(layer) {
          return new LayerColor(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles color reset
   *
   * @param {angular.Scope.Event} event
   * @protected
   */
  onColorReset(event) {
    // clear the label color config value
    this.onColorChange(event, '');

    // reset to the layer color
    this.scope['color'] = this.getColor_();
  }
}
