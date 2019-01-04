goog.provide('os.layer.config.MockTileLayerConfig');

goog.require('ol.source.TileWMS');
goog.require('os.layer.Tile');
goog.require('os.layer.config.AbstractLayerConfig');


/**
 * @constructor
 */
os.layer.config.MockTileLayerConfig = function() {
  goog.base(this);
};
goog.inherits(os.layer.config.MockTileLayerConfig, os.layer.config.AbstractLayerConfig);


/**
 * @type {string}
 * @const
 */
os.layer.config.MockTileLayerConfig.TYPE = 'MockLayerConfig';


/**
 * @param {Object} options The layer options.
 * @return {os.layer.Tile}
 */
os.layer.config.MockTileLayerConfig.prototype.createLayer = function(options) {
  var layer = new os.layer.Tile({
    source: new ol.source.TileWMS(/** @type {olx.source.TileWMSOptions} */ ({
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
};
