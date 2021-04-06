goog.module('plugin.cesium.tiles.LayerConfig');

const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');
const Layer = goog.require('plugin.cesium.tiles.Layer');


/**
 */
class LayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  createLayer(options) {
    this.initializeConfig(options);

    if (!options['url'] && options['assetId'] == null) {
      throw new Error('3D Tile layers must have a URL to the tileset.json or an Ion asset id');
    }

    var layer = new Layer();
    layer.restore(options);

    return layer;
  }
}

exports = LayerConfig;
