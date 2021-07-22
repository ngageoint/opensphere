goog.module('os.layer.config.MockTileLayerConfig');

const TileWMS = goog.require('ol.source.TileWMS');
const Tile = goog.require('os.layer.Tile');
const AbstractLayerConfig = goog.require('os.layer.config.AbstractLayerConfig');


/**
 */
class MockTileLayerConfig extends AbstractLayerConfig {
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

exports = MockTileLayerConfig;
