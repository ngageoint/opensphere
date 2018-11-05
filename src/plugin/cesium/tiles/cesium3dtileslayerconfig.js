goog.provide('plugin.cesium.tiles.LayerConfig');

goog.require('os.layer.config.AbstractLayerConfig');
goog.require('plugin.cesium.PrimitiveLayer');


/**
 * @extends {os.layer.config.AbstractLayerConfig}
 * @constructor
 */
plugin.cesium.tiles.LayerConfig = function() {
  plugin.cesium.tiles.LayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.cesium.tiles.LayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.LayerConfig.prototype.createLayer = function(options) {
  this.initializeConfig(options);

  if (!this.url) {
    throw new Error('3D Tile layers must have a URL to the tileset.json');
  }

  if (!Cesium) {
    throw new Error('Cesium is not available');
  }

  var tileset = new Cesium.Cesium3DTileset({
    url: this.url
  });

  var layer = new plugin.cesium.PrimitiveLayer();
  layer.setPrimitive(tileset);
  layer.restore(options);

  return layer;
};
