goog.provide('plugin.file.gpx.GPXPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.gpx.GPXDescriptor');
goog.require('plugin.file.gpx.GPXLayerConfig');
goog.require('plugin.file.gpx.GPXParser');
goog.require('plugin.file.gpx.GPXProvider');
goog.require('plugin.file.gpx.mime');
goog.require('plugin.file.gpx.ui.GPXImportUI');



/**
 * Provides GPX support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.gpx.GPXPlugin = function() {
  plugin.file.gpx.GPXPlugin.base(this, 'constructor');
  this.id = plugin.file.gpx.GPXPlugin.ID;
};
goog.inherits(plugin.file.gpx.GPXPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.gpx.GPXPlugin.ID = 'gpx';


/**
 * @type {string}
 * @const
 */
plugin.file.gpx.GPXPlugin.TYPE = 'GPX Layers';


/**
 * @inheritDoc
 */
plugin.file.gpx.GPXPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register kml provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.gpx.GPXPlugin.ID,
      plugin.file.gpx.GPXProvider,
      plugin.file.gpx.GPXPlugin.TYPE,
      plugin.file.gpx.GPXPlugin.TYPE));

  // register the kml descriptor type
  dm.registerDescriptorType(this.id, plugin.file.gpx.GPXDescriptor);

  // register the kml layer config
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(this.id, plugin.file.gpx.GPXLayerConfig);

  // register the kml import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails(this.id.toUpperCase(), true);
  im.registerImportUI(plugin.file.gpx.mime.TYPE, new plugin.file.gpx.ui.GPXImportUI());
  im.registerParser(this.id, plugin.file.gpx.GPXParser);
};
