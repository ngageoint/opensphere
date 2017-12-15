goog.provide('plugin.file.csv.CSVPlugin');

goog.require('os.data.DataManager');
goog.require('os.data.ProviderEntry');
goog.require('os.file.FileManager');
goog.require('os.layer.config.LayerConfigManager');
goog.require('os.plugin.AbstractPlugin');
goog.require('os.ui.im.ImportManager');
goog.require('plugin.file.csv.CSVDescriptor');
goog.require('plugin.file.csv.CSVExporter');
goog.require('plugin.file.csv.CSVLayerConfig');
goog.require('plugin.file.csv.CSVParser');
goog.require('plugin.file.csv.CSVProvider');
goog.require('plugin.file.csv.CSVTypeMethod');
goog.require('plugin.file.csv.ui.CSVImportUI');



/**
 * Provides CSV support
 * @extends {os.plugin.AbstractPlugin}
 * @constructor
 */
plugin.file.csv.CSVPlugin = function() {
  plugin.file.csv.CSVPlugin.base(this, 'constructor');
  this.id = plugin.file.csv.CSVPlugin.ID;
};
goog.inherits(plugin.file.csv.CSVPlugin, os.plugin.AbstractPlugin);


/**
 * @type {string}
 * @const
 */
plugin.file.csv.CSVPlugin.ID = 'csv';


/**
 * @type {string}
 * @const
 */
plugin.file.csv.CSVPlugin.TYPE = 'CSV Layers';


/**
 * @inheritDoc
 */
plugin.file.csv.CSVPlugin.prototype.init = function() {
  var dm = os.dataManager;

  // register csv provider type
  dm.registerProviderType(new os.data.ProviderEntry(
      plugin.file.csv.CSVPlugin.ID,
      plugin.file.csv.CSVProvider,
      plugin.file.csv.CSVPlugin.TYPE,
      plugin.file.csv.CSVPlugin.TYPE,
      ''));

  // register the csv descriptor type
  dm.registerDescriptorType(this.id, plugin.file.csv.CSVDescriptor);

  // register the csv layer config
  var lcm = os.layer.config.LayerConfigManager.getInstance();
  lcm.registerLayerConfig('CSV', plugin.file.csv.CSVLayerConfig);

  // register the csv file type method
  var fm = os.file.FileManager.getInstance();
  fm.registerContentTypeMethod(new plugin.file.csv.CSVTypeMethod());

  // register the csv import ui
  var im = os.ui.im.ImportManager.getInstance();
  im.registerImportDetails('CSV', true);
  im.registerImportUI('csv', new plugin.file.csv.ui.CSVImportUI());
  im.registerParser('csv', plugin.file.csv.CSVParser);

  // register the csv exporter
  os.ui.exportManager.registerExportMethod(new plugin.file.csv.CSVExporter());
};
