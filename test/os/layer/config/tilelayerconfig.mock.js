goog.declareModuleId('os.layer.config.MockTileLayerConfig');

import TileWMS from 'ol/src/source/TileWMS';

import AbstractLayerConfig from '../../../../src/os/layer/config/abstractdatasourcelayerconfig';
import Tile from '../../../../src/os/layer/tile';

/**
 */
export default class MockTileLayerConfig extends AbstractLayerConfig {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @param {Object} options The layer options.
   * @return {Tile}
   */
  createLayer(options) {
    var layer = new Tile({
      source: new TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
        params: {
          'LAYERS': 'dontcare'
        },
        projection: 'EPSG:4326'
      }))
    });

    if (options['id']) {
      layer.setId(options['id']);
    }

    return layer;
  }
}

/**
 * @type {string}
 * @const
 */
MockTileLayerConfig.TYPE = 'MockLayerConfig';
