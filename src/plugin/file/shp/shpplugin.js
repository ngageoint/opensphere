goog.module('plugin.file.shp.SHPPlugin');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const exportManager = goog.require('os.ui.exportManager');
const ImportManager = goog.require('os.ui.im.ImportManager');
const SHPDescriptor = goog.require('plugin.file.shp.SHPDescriptor');
const SHPExporter = goog.require('plugin.file.shp.SHPExporter');
const SHPLayerConfig = goog.require('plugin.file.shp.SHPLayerConfig');
const SHPParser = goog.require('plugin.file.shp.SHPParser');
const SHPProvider = goog.require('plugin.file.shp.SHPProvider');
const mime = goog.require('plugin.file.shp.mime');
const SHPImportUI = goog.require('plugin.file.shp.ui.SHPImportUI');
const ZipSHPImportUI = goog.require('plugin.file.shp.ui.ZipSHPImportUI');


/**
 * Provides SHP support
 */
class SHPPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = SHPPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register shp provider type
    dm.registerProviderType(new ProviderEntry(SHPPlugin.ID, SHPProvider, SHPPlugin.TYPE, SHPPlugin.TYPE));

    // register the shp descriptor type
    dm.registerDescriptorType(this.id, SHPDescriptor);

    // register the shp layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(this.id, SHPLayerConfig);

    // register the shp import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('Shapefile (SHP/DBF or ZIP)', true);
    im.registerImportUI(mime.TYPE, new SHPImportUI());
    im.registerImportUI(mime.ZIP_TYPE, new ZipSHPImportUI());
    im.registerParser(this.id, SHPParser);

    // register the shp exporter
    exportManager.registerExportMethod(new SHPExporter());
  }
}


/**
 * @type {string}
 * @const
 */
SHPPlugin.ID = 'shp';


/**
 * @type {string}
 * @const
 */
SHPPlugin.TYPE = 'SHP Layers';


exports = SHPPlugin;
