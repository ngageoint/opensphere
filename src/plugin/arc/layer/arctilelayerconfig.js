goog.declareModuleId('plugin.arc.layer.ArcTileLayerConfig');

import AbstractTileLayerConfig from '../../../os/layer/config/abstracttilelayerconfig.js';
import ArcTileSource from '../source/arctilesource.js';
import AnimatedArcTile from './animatedarctilelayer.js';


/**
 * Layer config for Arc tile layers.
 */
class ArcTileLayerConfig extends AbstractTileLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  initializeConfig(options) {
    super.initializeConfig(options);
    this.layerClass = options['animate'] ? AnimatedArcTile : this.layerClass;
  }

  /**
   * @inheritDoc
   */
  getSource(options) {
    var params = {};
    var keys = this.params.getKeys();
    for (var i = 0, n = keys.length; i < n; i++) {
      var key = keys[i];
      params[key] = this.params.get(key);
    }

    var arcOptions = /** @type {olx.source.TileArcGISRestOptions} */ ({
      urls: this.urls,
      params: params,
      tileGrid: this.tileGrid,
      projection: this.projection,
      crossOrigin: this.crossOrigin,
      wrapX: this.projection.isGlobal()
    });

    return new ArcTileSource(arcOptions);
  }
}


/**
 * Arc tile layer config ID.
 * @type {string}
 */
ArcTileLayerConfig.ID = 'arctile';


export default ArcTileLayerConfig;
