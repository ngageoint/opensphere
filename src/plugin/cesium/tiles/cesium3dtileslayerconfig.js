goog.provide('plugin.cesium.tiles.LayerConfig');

goog.require('os.layer.LayerType');
goog.require('os.layer.config.AbstractLayerConfig');
goog.require('plugin.cesium.tiles.Layer');


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

  var layer = new plugin.cesium.tiles.Layer();
  layer.restore(options);

  return layer;
};
