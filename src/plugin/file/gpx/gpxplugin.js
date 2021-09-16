goog.module('plugin.file.gpx.GPXPlugin');

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');
const GPXDescriptor = goog.require('plugin.file.gpx.GPXDescriptor');
const GPXLayerConfig = goog.require('plugin.file.gpx.GPXLayerConfig');
const GPXParser = goog.require('plugin.file.gpx.GPXParser');
const GPXProvider = goog.require('plugin.file.gpx.GPXProvider');
const mime = goog.require('plugin.file.gpx.mime');
const GPXImportUI = goog.require('plugin.file.gpx.ui.GPXImportUI');


/**
 * Provides GPX support
 */
class GPXPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = GPXPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register kml provider type
    dm.registerProviderType(new ProviderEntry(GPXPlugin.ID, GPXProvider, GPXPlugin.TYPE, GPXPlugin.TYPE));

    // register the kml descriptor type
    dm.registerDescriptorType(this.id, GPXDescriptor);

    // register the kml layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(this.id, GPXLayerConfig);

    // register the kml import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails(this.id.toUpperCase(), true);
    im.registerImportUI(mime.TYPE, new GPXImportUI());
    im.registerParser(this.id, GPXParser);
  }
}


/**
 * @type {string}
 * @const
 */
GPXPlugin.ID = 'gpx';


/**
 * @type {string}
 * @const
 */
GPXPlugin.TYPE = 'GPX Layers';


exports = GPXPlugin;
