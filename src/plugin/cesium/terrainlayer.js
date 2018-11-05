goog.provide('plugin.cesium.TerrainLayer');

goog.require('plugin.cesium.Layer');


/**
 * @extends {plugin.cesium.Layer}
 * @constructor
 */
plugin.cesium.TerrainLayer = function() {
  plugin.cesium.TerrainLayer(this, 'constructor');

  this.setOSType(os.layer.LayerType.TERRAIN);
  this.setExplicitType(os.layer.LayerType.TERRAIN);
  this.setLayerUI('terrainlayerui');
  this.setIcons(os.ui.Icons.TERRAIN);
  this.type = /** @type {ol.LayerType} */ (os.layer.LayerType.TERRAIN);
};
goog.inherits(plugin.cesium.TerrainLayer, plugin.cesium.Layer);
