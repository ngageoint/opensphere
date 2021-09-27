goog.declareModuleId('plugin.heatmap.HeatmapLayerUI');

import {ROOT} from '../../os/os.js';
import {Controller as DefaultLayerUICtrl} from '../../os/ui/layer/defaultlayerui.js';
import Module from '../../os/ui/module.js';
import Gradient from './cmd/gradientcmd.js';
import Intensity from './cmd/intensitycmd.js';
import Size from './cmd/sizecmd.js';
import HeatmapPropertyType from './heatmappropertytype.js';

const Delay = goog.require('goog.async.Delay');

const googObject = goog.require('goog.object');
const osColor = goog.require('os.color');


/**
 * The directive for heatmap layer controls
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  templateUrl: ROOT + 'views/plugin/heatmap/heatmap.html',
  controller: Controller,
  controllerAs: 'heatmap'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'heatmaplayerui';


/**
 * Add the directive to the module
 */
Module.directive('heatmaplayerui', [directive]);



/**
 * Controller for the vector layer UI
 * @unrestricted
 */
export class Controller extends DefaultLayerUICtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$timeout} $timeout
   * @ngInject
   */
  constructor($scope, $element, $timeout) {
    super($scope, $element, $timeout);

    $scope.$on('size.slidestop', this.onSizeChange.bind(this));
    $scope.$on('intensity.slidestop', this.onIntensityChange.bind(this));
    $scope.$on('intensity.spinstop', this.onIntensityChange.bind(this));
    this['maxIntensity'] = 50;

    // add heatmap-specific events to the initEvents array
    this.initEvents = this.initEvents.concat(googObject.getValues(HeatmapPropertyType));
    this.intensityDelay = new Delay(this.changeIntensity_, 1000, this);
  }

  /**
   * @inheritDoc
   */
  initUI() {
    super.initUI();

    if (this.scope) {
      this.scope['size'] = this.getSize_();
      this.scope['intensity'] = this.getIntensity_();

      this.scope['gradients'] = [
        {'title': 'Rainbow', 'gradient': osColor.RAINBOW_HEATMAP_GRADIENT_HEX},
        {'title': 'Thermal', 'gradient': osColor.THERMAL_HEATMAP_GRADIENT_HEX}
      ];
      var gradient = this.getGradient_();
      this.scope['gradient'] = this.scope['gradients'][gradient == osColor.THERMAL_HEATMAP_GRADIENT_HEX ? 1 : 0];
    }
  }

  /**
   * Handles changes to the gradient
   *
   * @export
   */
  onGradientChange() {
    var value = this.scope['gradient']['gradient'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new Gradient(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Handles changes to the gradient
   *
   * @return {Array}
   * @private
   */
  getGradient_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
          if (layer) {
            return layer.getGradient();
          }
        } catch (e) {
        }
      }
    }
    return [];
  }

  /**
   * Handles changes to size
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onSizeChange(event, value) {
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new Size(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Gets the size from the layer
   *
   * @return {number}
   * @private
   */
  getSize_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
          if (layer) {
            return layer.getSize();
          }
        } catch (e) {
        }
      }
    }

    return 1.0;
  }

  /**
   * Handles changes to intensity
   *
   * @param {angular.Scope.Event} event
   * @param {number} value
   * @protected
   */
  onIntensityChange(event, value) {
    this.scope['intensity'] = value;
    this.intensityDelay.start();
  }

  /**
   * Implements changes to intensity
   *
   * @private
   */
  changeIntensity_() {
    var value = this.scope['intensity'];
    var fn =
        /**
         * @param {os.layer.ILayer} layer
         * @return {os.command.ICommand}
         */
        function(layer) {
          return new Intensity(layer.getId(), value);
        };

    this.createCommand(fn);
  }

  /**
   * Gets the intensity from the layer
   *
   * @return {number}
   * @private
   */
  getIntensity_() {
    var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);
    if (items) {
      for (var i = 0, n = items.length; i < n; i++) {
        try {
          var layer = /** @type {plugin.heatmap.Heatmap} */ (items[i].getLayer());
          if (layer) {
            return layer.getIntensity();
          }
        } catch (e) {
        }
      }
    }

    return this['maxIntensity'] / 2; // default to the middle of the slider - THIN-8618
  }
}
