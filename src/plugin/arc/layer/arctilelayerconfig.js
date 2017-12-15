goog.provide('plugin.arc.layer.ArcTileLayerConfig');

goog.require('os.layer.config.AbstractTileLayerConfig');
goog.require('plugin.arc.layer.AnimatedArcTile');
goog.require('plugin.arc.source.ArcTileSource');



/**
 * Layer config for Arc tile layers.
 * @extends {os.layer.config.AbstractTileLayerConfig}
 * @constructor
 */
plugin.arc.layer.ArcTileLayerConfig = function() {
  plugin.arc.layer.ArcTileLayerConfig.base(this, 'constructor');
};
goog.inherits(plugin.arc.layer.ArcTileLayerConfig, os.layer.config.AbstractTileLayerConfig);


/**
 * Arc tile layer config ID.
 * @type {string}
 */
plugin.arc.layer.ArcTileLayerConfig.ID = 'arctile';


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcTileLayerConfig.prototype.initializeConfig = function(options) {
  plugin.arc.layer.ArcTileLayerConfig.base(this, 'initializeConfig', options);
  this.tileClass = options['animate'] ? plugin.arc.layer.AnimatedArcTile : this.tileClass;
};


/**
 * @inheritDoc
 */
plugin.arc.layer.ArcTileLayerConfig.prototype.getSource = function(options) {
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

  return new plugin.arc.source.ArcTileSource(arcOptions);
};
