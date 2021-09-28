goog.declareModuleId('plugin.file.kml.KMLPlugin');

import './ui/placemarkedit.js';

import KMLDescriptor from './kmldescriptor.js';
import KMLExporter from './kmlexporter.js';
import KMLFeatureParser from './kmlfeatureparser.js';
import KMLLayerConfig from './kmllayerconfig.js';
import * as menu from './kmlmenu.js';
import KMLParser from './kmlparser.js';
import KMLProvider from './kmlprovider.js';
import * as mime from './mime.js';
import KMLImportUI from './ui/kmlimportui.js';

const Settings = goog.require('os.config.Settings');
const DataManager = goog.require('os.data.DataManager');
const ProviderEntry = goog.require('os.data.ProviderEntry');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const Request = goog.require('os.net.Request');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const exportManager = goog.require('os.ui.exportManager');
const kml = goog.require('os.ui.file.kml');
const ImportManager = goog.require('os.ui.im.ImportManager');


/**
 * Provides KML support
 */
export default class KMLPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = KMLPlugin.ID;
  }

  /**
   * @inheritDoc
   */
  init() {
    var dm = DataManager.getInstance();

    // register kml provider type
    dm.registerProviderType(new ProviderEntry(
        KMLPlugin.ID,
        KMLProvider,
        KMLPlugin.TYPE,
        KMLPlugin.TYPE));

    // register the kml descriptor type
    dm.registerDescriptorType(this.id, KMLDescriptor);

    // register the kml layer config
    var lcm = LayerConfigManager.getInstance();
    lcm.registerLayerConfig(this.id, KMLLayerConfig);

    // register the kml import ui
    var im = ImportManager.getInstance();
    im.registerImportDetails('KML/KMZ', true);
    im.registerImportUI(mime.TYPE, new KMLImportUI());
    im.registerImportUI(mime.KMZ_TYPE, new KMLImportUI());
    im.registerParser(this.id, KMLParser);
    im.registerParser('kmlfeature', KMLFeatureParser);

    // register the kml exporter
    exportManager.registerExportMethod(new KMLExporter());

    // set up actions
    menu.treeSetup();

    // try to load the first google earth icon; if it fails, set the mirror and flag
    return new Request(kml.GOOGLE_EARTH_ICON_SET[0].path).getPromise()
        .then(() => {}, () => {
          const settings = Settings.getInstance();
          const mirror = /** @type {string|null} */ (settings.get(KMLPlugin.ICON_MIRROR));
          if (mirror) {
            kml.setMirror(mirror);
          }
          kml.setGoogleMapsAccessible(false);
        });
  }
}


/**
 * @type {string}
 * @const
 */
KMLPlugin.ID = 'kml';


/**
 * @type {string}
 * @const
 */
KMLPlugin.TYPE = 'KML Layers';


/**
 * @type {string}
 * @const
 */
KMLPlugin.ICON_MIRROR = 'plugin.file.kml.icon.mirror';
