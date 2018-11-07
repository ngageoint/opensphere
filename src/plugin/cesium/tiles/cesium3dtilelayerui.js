goog.provide('plugin.cesium.tiles.Cesium3DTileLayerUICtrl');
goog.provide('plugin.cesium.tiles.cesium3DTileLayerUIDirective');

goog.require('os.command.LayerColor');
goog.require('os.defines');
goog.require('os.implements');
goog.require('os.ui.Module');
goog.require('os.ui.layer');
goog.require('os.ui.layer.DefaultLayerUICtrl');
goog.require('os.ui.sliderDirective');


/**
 * Layer controls UI for Cesium 3D tile layers.
 * @return {angular.Directive}
 */
plugin.cesium.tiles.cesium3DTileLayerUIDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    templateUrl: os.ROOT + 'views/plugin/cesium/cesium3dtile.html',
    controller: plugin.cesium.tiles.Cesium3DTileLayerUICtrl,
    controllerAs: 'ctrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('cesium3dtilelayerui', [plugin.cesium.tiles.cesium3DTileLayerUIDirective]);



/**
 * Controller for the Cesium 3D tile layer UI.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @param {!angular.$timeout} $timeout The Angular $timeout service.
 * @extends {os.ui.layer.DefaultLayerUICtrl}
 * @constructor
 * @ngInject
 */
plugin.cesium.tiles.Cesium3DTileLayerUICtrl = function($scope, $element, $timeout) {
  plugin.cesium.tiles.Cesium3DTileLayerUICtrl.base(this, 'constructor', $scope, $element, $timeout);

  $scope.$on('color.change', this.onColorChange.bind(this));
  $scope.$on('color.reset', this.onColorReset.bind(this));
};
goog.inherits(plugin.cesium.tiles.Cesium3DTileLayerUICtrl, os.ui.layer.DefaultLayerUICtrl);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Cesium3DTileLayerUICtrl.prototype.initUI = function() {
  plugin.cesium.tiles.Cesium3DTileLayerUICtrl.base(this, 'initUI');

  if (this.scope) {
    this.scope['color'] = this.getColor_();
  }
};


/**
 * Gets the color from the item(s)
 * @return {?string} a hex color string
 * @private
 */
plugin.cesium.tiles.Cesium3DTileLayerUICtrl.prototype.getColor_ = function() {
  var items = /** @type {Array<!os.data.LayerNode>} */ (this.scope['items']);

  if (items) {
    for (var i = 0, n = items.length; i < n; i++) {
      try {
        var layer = items[i].getLayer();
        if (os.implements(layer, os.layer.IColorableLayer.ID)) {
          var color = /** @type {os.layer.IColorableLayer} */ (layer).getColor();
          return color ? os.color.toHexString(color) : color;
        }
      } catch (e) {
      }
    }
  }

  return null;
};


/**
 * Handles changes to color
 * @param {angular.Scope.Event} event
 * @param {string} value
 * @protected
 */
plugin.cesium.tiles.Cesium3DTileLayerUICtrl.prototype.onColorChange = function(event, value) {
  var fn =
      /**
       * @param {os.layer.ILayer} layer
       * @return {os.command.ICommand}
       */
      function(layer) {
        return new os.command.LayerColor(layer.getId(), value);
      };

  this.createCommand(fn);
};


/**
 * Handles color reset
 * @param {angular.Scope.Event} event
 * @protected
 */
plugin.cesium.tiles.Cesium3DTileLayerUICtrl.prototype.onColorReset = function(event) {
  // clear the label color config value
  this.onColorChange(event, '');

  // reset to the layer color
  this.scope['color'] = this.getColor_();
};
