goog.provide('plugin.cesium.tiles.Provider');

goog.require('os.data.BaseDescriptor');
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

  var layers = config['layers'];
  if (layers) {
    var dm = os.dataManager;
    for (var key in layers) {
      var id = this.getId() + os.data.BaseDescriptor.ID_DELIMITER + key;
      var d = dm.getDescriptor(id);

      if (!d) {
        d = dm.createDescriptor(plugin.cesium.tiles.ID);
        d.setId(id);
        dm.addDescriptor(d);
      }

      d.updateFromConfig(layers[key]);
      d.updateActiveFromTemp();
    }
  }
};
