goog.declareModuleId('plugin.file.gpx.GPXPlugin');

import GPXDescriptor from './gpxdescriptor.js';
import GPXLayerConfig from './gpxlayerconfig.js';
import GPXParser from './gpxparser.js';
import GPXProvider from './gpxprovider.js';
import * as mime from './mime.js';
import GPXImportUI from './ui/gpximportui.js';

const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ImportManager = goog.require('os.ui.im.ImportManager');

/**
 * Provides GPX support
 */
export default class GPXPlugin extends AbstractPlugin {
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
