goog.provide('plugin.cesium.tiles.Provider');

goog.require('os.data.FileProvider');
goog.require('plugin.cesium.tiles');



/**
 * Cesium 3D tiles provider.
 *
 * @extends {os.data.FileProvider}
 * @constructor
 */
plugin.cesium.tiles.Provider = function() {
  plugin.cesium.tiles.Provider.base(this, 'constructor');
};
goog.inherits(plugin.cesium.tiles.Provider, os.data.FileProvider);
goog.addSingletonGetter(plugin.cesium.tiles.Provider);


/**
 * @inheritDoc
 */
plugin.cesium.tiles.Provider.prototype.configure = function(config) {
  plugin.cesium.tiles.Provider.base(this, 'configure', config);
  this.setId(plugin.cesium.tiles.ID);
  this.setLabel(plugin.cesium.tiles.TYPE);
};
