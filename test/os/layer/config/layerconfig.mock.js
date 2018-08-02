goog.provide('os.layer.config.MockLayerConfig');
goog.require('ol.source.TileWMS');
goog.require('os.layer.Tile');
goog.require('os.layer.config.AbstractLayerConfig');



os.layer.config.MockLayerConfig = function() {
  goog.base(this);
};
goog.inherits(os.layer.config.MockLayerConfig, os.layer.config.AbstractLayerConfig);


os.layer.config.MockLayerConfig.TYPE = 'MockLayerConfig';


os.layer.config.MockLayerConfig.prototype.createLayer = function(options) {
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
