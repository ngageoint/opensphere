goog.provide('plugin.vectortile.VectorTilePlugin');

goog.require('os.plugin.AbstractPlugin');
goog.require('plugin.vectortile');
goog.require('plugin.vectortile.VectorTileLayerConfig');



/**
 * Plugin for arc server support in opensphere.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.vectortile.VectorTilePlugin = function() {
  plugin.vectortile.VectorTilePlugin.base(this, 'constructor');
  this.id = plugin.vectortile.ID;
};
goog.inherits(plugin.vectortile.VectorTilePlugin, os.plugin.AbstractPlugin);
goog.addSingletonGetter(plugin.vectortile.VectorTilePlugin);


/**
 * @inheritDoc
 */
plugin.vectortile.VectorTilePlugin.prototype.init = function() {
  // var dm = os.dataManager;
  // var arcEntry = new os.data.ProviderEntry(this.id, plugin.vectortile.VectorTileServer, 'Arc Server',
  //     'Arc servers provide feature and tile data.');

  // dm.registerProviderType(arcEntry);
  // dm.registerDescriptorType(this.id, plugin.arc.layer.ArcLayerDescriptor);

  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.vectortile.ID, plugin.vectortile.VectorTileLayerConfig);

  // var im = os.ui.im.ImportManager.getInstance();
  // im.registerImportUI(this.id, new os.ui.ProviderImportUI('<arcserver></arcserver>'));
};
