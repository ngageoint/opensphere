goog.module('plugin.file.csv.CSVPlugin');

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const csv = goog.require('os.file.mime.csv');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const exportManager = goog.require('os.ui.exportManager');
const ImportManager = goog.require('os.ui.im.ImportManager');
const CSVDescriptor = goog.require('plugin.file.csv.CSVDescriptor');
const CSVExporter = goog.require('plugin.file.csv.CSVExporter');
const CSVLayerConfig = goog.require('plugin.file.csv.CSVLayerConfig');
const CSVParser = goog.require('plugin.file.csv.CSVParser');
const CSVProvider = goog.require('plugin.file.csv.CSVProvider');
const CSVImportUI = goog.require('plugin.file.csv.ui.CSVImportUI');


/**
 * Provides CSV support
 */
class CSVPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = CSVPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register csv provider type
    dm.registerProviderType(new ProviderEntry(CSVPlugin.ID, CSVProvider, CSVPlugin.TYPE, CSVPlugin.TYPE));

    // register the csv descriptor type
    dm.registerDescriptorType(this.id, CSVDescriptor);

    // register the csv layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig('CSV', CSVLayerConfig);

    // register the csv import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('CSV', true);
    im.registerImportUI(csv.TYPE, new CSVImportUI());
    im.registerParser(this.id, CSVParser);

    // register the csv exporter
    exportManager.registerExportMethod(new CSVExporter());
  }
}


/**
 * @type {string}
 * @const
 */
CSVPlugin.ID = 'csv';


/**
 * @type {string}
 * @const
 */
CSVPlugin.TYPE = 'CSV Layers';


exports = CSVPlugin;
