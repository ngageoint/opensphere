goog.declareModuleId('plugin.file.geojson.GeoJSONPlugin');

import GeoJSONDescriptor from './geojsondescriptor.js';
import GeoJSONExporter from './geojsonexporter.js';
import GeoJSONImportUI from './geojsonimportui.js';
import GeoJSONLayerConfig from './geojsonlayerconfig.js';
import * as GeoJSONMixin from './geojsonmixin.js';
import GeoJSONProvider from './geojsonprovider.js';
import GeoJSONSimpleStyleParser from './geojsonsimplestyleparser.js';
import * as mime from './mime.js';

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const exportManager = goog.require('os.ui.exportManager');
const ImportManager = goog.require('os.ui.im.ImportManager');

// Initialize the GeoJSON mixin.
GeoJSONMixin.init();


/**
 * Provides GeoJSON support
 */
export default class GeoJSONPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = GeoJSONPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register geojson provider type
    dm.registerProviderType(new ProviderEntry(GeoJSONPlugin.ID, GeoJSONProvider, GeoJSONPlugin.TYPE,
        GeoJSONPlugin.TYPE));

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
 * @const
 */
GeoJSONPlugin.ID = 'geojson';


/**
 * @type {string}
 * @const
 */
GeoJSONPlugin.TYPE = 'GeoJSON Layers';
