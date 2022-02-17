goog.declareModuleId('plugin.cesium.tiles.LayerConfig');

import AbstractLayerConfig from '../../../os/layer/config/abstractlayerconfig.js';
import Layer from './cesium3dtileslayer.js';

/**
 */
export default class LayerConfig extends AbstractLayerConfig {
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
