goog.provide('plugin.file.gml.GMLPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.gml.GMLDescriptor');
goog.require('plugin.file.gml.GMLImportUI');
goog.require('plugin.file.gml.GMLLayerConfig');
goog.require('plugin.file.gml.GMLMixin');
goog.require('plugin.file.gml.GMLParser');
goog.require('plugin.file.gml.GMLProvider');
goog.require('plugin.file.gml.mime');



/**
 * Provides GML support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.gml.GMLPlugin = function() {
  plugin.file.gml.GMLPlugin.base(this, 'constructor');
  this.id = plugin.file.gml.GMLPlugin.ID;
};
goog.inherits(plugin.file.gml.GMLPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.gml.GMLPlugin.ID = 'gml';


/**
 * @type {string}
 * @const
 */
plugin.file.gml.GMLPlugin.TYPE = 'GML Layers';


/**
 * @inheritDoc
 */
plugin.file.gml.GMLPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register gml provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.gml.GMLPlugin.ID,
      plugin.file.gml.GMLProvider,
      plugin.file.gml.GMLPlugin.TYPE,
      plugin.file.gml.GMLPlugin.TYPE));

  // register the gml descriptor type
  dm.registerDescriptorType(this.id, plugin.file.gml.GMLDescriptor);

  // register the gml layer config
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(this.id, plugin.file.gml.GMLLayerConfig);

  // register the gml import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails(this.id.toUpperCase(), true);
  im.registerImportUI(plugin.file.gml.mime.TYPE, new plugin.file.gml.GMLImportUI());
  im.registerParser(this.id, plugin.file.gml.GMLParser);
};
