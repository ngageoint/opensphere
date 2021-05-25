goog.module('plugin.file.geojson.GeoJSONPlugin');
goog.module.declareLegacyNamespace();

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const exportManager = goog.require('os.ui.exportManager');
const ImportManager = goog.require('os.ui.im.ImportManager');
const GeoJSONDescriptor = goog.require('plugin.file.geojson.GeoJSONDescriptor');
const GeoJSONExporter = goog.require('plugin.file.geojson.GeoJSONExporter');
const GeoJSONImportUI = goog.require('plugin.file.geojson.GeoJSONImportUI');
const GeoJSONLayerConfig = goog.require('plugin.file.geojson.GeoJSONLayerConfig');
const GeoJSONProvider = goog.require('plugin.file.geojson.GeoJSONProvider');
const GeoJSONSimpleStyleParser = goog.require('plugin.file.geojson.GeoJSONSimpleStyleParser');
const mime = goog.require('plugin.file.geojson.mime');
const GeoJSONMixin = goog.require('plugin.file.geojson.mixin');


// Initialize the GeoJSON mixin.
GeoJSONMixin.init();


/**
 * Provides GeoJSON support
 */
class GeoJSONPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register geojson provider type
    dm.registerProviderType(new ProviderEntry(ID, GeoJSONProvider, TYPE, TYPE));

    // register the geojson descriptor type
    dm.registerDescriptorType(this.id, GeoJSONDescriptor);

    // register the geojson layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig('GeoJSON', GeoJSONLayerConfig);

    // register the geojson import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('GeoJSON', true);
    im.registerImportUI(mime.TYPE, new GeoJSONImportUI());
    im.registerParser(this.id, GeoJSONSimpleStyleParser);
    im.registerParser(this.id + '-simplespec', GeoJSONSimpleStyleParser);

    // register the geojson exporter
    exportManager.registerExportMethod(new GeoJSONExporter());
  }
}


/**
 * @type {string}
 */
const ID = 'geojson';


/**
 * @type {string}
 */
const TYPE = 'GeoJSON Layers';


exports = GeoJSONPlugin;
