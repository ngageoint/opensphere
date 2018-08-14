goog.provide('plugin.arc.ArcPlugin');

goog.require('os.data.ProviderEntry');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.state.StateManager');
goog.require('os.ui.ProviderImportUI');
goog.require('plugin.arc');
goog.require('plugin.arc.ArcServer');
goog.require('plugin.arc.arcImportDirective');
goog.require('plugin.arc.layer.ArcFeatureLayerConfig');
goog.require('plugin.arc.layer.ArcLayerDescriptor');
goog.require('plugin.arc.layer.ArcTileLayerConfig');
goog.require('plugin.arc.mime');
goog.require('plugin.arc.state.v2.arcstate');



/**
 * Plugin for arc server support in opensphere.
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.arc.ArcPlugin = function() {
  plugin.arc.ArcPlugin.base(this, 'constructor');
  this.id = plugin.arc.ID;
};
goog.inherits(plugin.arc.ArcPlugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.arc.ArcPlugin.prototype.init = function() {
  var dm = os.dataManager;
  var arcEntry = new os.data.ProviderEntry(this.id, plugin.arc.ArcServer, 'Arc Server',
      'Arc servers provide feature and tile data.');

  dm.registerProviderType(arcEntry);
  dm.registerDescriptorType(this.id, plugin.arc.layer.ArcLayerDescriptor);

  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.arc.layer.ArcFeatureLayerConfig.ID, plugin.arc.layer.ArcFeatureLayerConfig);
  lcm.registerLayerConfig(plugin.arc.layer.ArcTileLayerConfig.ID, plugin.arc.layer.ArcTileLayerConfig);

  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportUI(this.id, new os.ui.ProviderImportUI('<arcserver></arcserver>'));

  var sm = os.state.StateManager.getInstance();
  sm.addLoadFunction(plugin.arc.state.v2.arcstate.load);
  sm.addSaveFunction(plugin.arc.state.v2.arcstate.save);
};
