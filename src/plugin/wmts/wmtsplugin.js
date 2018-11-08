goog.provide('plugin.wmts.Plugin');

goog.require('os.data.ConfigDescriptor');
goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.ProviderImportUI');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.wmts');
goog.require('plugin.wmts.LayerConfig');
goog.require('plugin.wmts.Server');
goog.require('plugin.wmts.importDirective');
goog.require('plugin.wmts.mime');


/**
 * Provides WMTS support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.wmts.Plugin = function() {
  plugin.wmts.Plugin.base(this, 'constructor');
  this.id = plugin.wmts.ID;
};
goog.inherits(plugin.wmts.Plugin, os.plugin.AbstractPlugin);


/**
 * @inheritDoc
 */
plugin.wmts.Plugin.prototype.init = function() {
  var dm = os.dataManager;

  dm.registerProviderType(new os.data.ProviderEntry(
    plugin.wmts.ID, plugin.wmts.Server, 'WMTS Server',
    'WMTS servers provide map tiles through the Web Map Tile Service specification'));

  // register the layer configurations
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(plugin.wmts.ID, plugin.wmts.LayerConfig);

  dm.registerDescriptorType(os.data.ConfigDescriptor.ID, os.data.ConfigDescriptor);

  // register the server forms for adding/editing servers
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportUI(plugin.wmts.ID, new os.ui.ProviderImportUI('wmtsserver'));
};
