goog.provide('plugin.file.kml.KMLPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.kml.KMLDescriptor');
goog.require('plugin.file.kml.KMLExporter');
goog.require('plugin.file.kml.KMLFeatureParser');
goog.require('plugin.file.kml.KMLLayerConfig');
goog.require('plugin.file.kml.KMLParser');
goog.require('plugin.file.kml.KMLProvider');
goog.require('plugin.file.kml.menu');
goog.require('plugin.file.kml.mime');
goog.require('plugin.file.kml.ui.KMLImportUI');
goog.require('plugin.file.kml.ui.placemarkEditDirective');


/**
 * Provides KML support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.kml.KMLPlugin = function() {
  plugin.file.kml.KMLPlugin.base(this, 'constructor');
  this.id = plugin.file.kml.KMLPlugin.ID;
};
goog.inherits(plugin.file.kml.KMLPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.kml.KMLPlugin.ID = 'kml';


/**
 * @type {string}
 * @const
 */
plugin.file.kml.KMLPlugin.TYPE = 'KML Layers';


/**
 * @inheritDoc
 */
plugin.file.kml.KMLPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register kml provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.kml.KMLPlugin.ID,
      plugin.file.kml.KMLProvider,
      plugin.file.kml.KMLPlugin.TYPE,
      plugin.file.kml.KMLPlugin.TYPE));

  // register the kml descriptor type
  dm.registerDescriptorType(this.id, plugin.file.kml.KMLDescriptor);

  // register the kml layer config
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig(this.id, plugin.file.kml.KMLLayerConfig);

  // register the kml import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('KML/KMZ', true);
  im.registerImportUI(plugin.file.kml.mime.TYPE, new plugin.file.kml.ui.KMLImportUI());
  im.registerImportUI(plugin.file.kml.mime.KMZ_TYPE, new plugin.file.kml.ui.KMLImportUI());
  im.registerParser(this.id, plugin.file.kml.KMLParser);
  im.registerParser('kmlfeature', plugin.file.kml.KMLFeatureParser);

  // register the kml exporter
  os.ui.exportManager.registerExportMethod(new plugin.file.kml.KMLExporter());

  // set up actions
  plugin.file.kml.menu.treeSetup();
};
