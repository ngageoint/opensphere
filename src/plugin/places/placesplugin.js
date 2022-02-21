goog.declareModuleId('plugin.places.PlacesPlugin');

import './ui/placesnodeui.js';
import './ui/placesui.js';
import LayerConfigManager from '../../os/layer/config/layerconfigmanager.js';
import AbstractPlugin from '../../os/plugin/abstractplugin.js';
import ClearEntry from '../../os/ui/clear/clearentry.js';
import ClearManager from '../../os/ui/clear/clearmanager.js';
import ImportMethod from '../../os/ui/file/method/importmethod.js';
import * as mime from '../file/kml/mime.js';
import KMLPlacesImportUI from './kmlplacesimportui.js';
import * as places from './places.js';
import PlacesHide from './placeshidecmd.js';
import PlacesLayerConfig from './placeslayerconfig.js';
import PlacesManager from './placesmanager.js';
import * as menu from './placesmenu.js';

const log = goog.require('goog.log');


/**
 * Plugin that allows the user to manage saved features as a KML tree.
 */
export default class PlacesPlugin extends AbstractPlugin {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.id = places.ID;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    menu.layerDispose();
    menu.mapDispose();
    menu.spatialDispose();
  }

  /**
   * @inheritDoc
   */
  init() {
    try {
      //
      // Create the global instance and set it on the places module.
      //
      // This is intended to reduce impact of circular dependencies in imports that are not an issue in terms of code
      // execution order.
      //
      var manager = PlacesManager.getInstance();
      manager.initialize();
      places.setPlacesManager(manager);

      // register places actions
      menu.layerSetup();
      menu.mapSetup();
      menu.spatialSetup();
    } catch (e) {
      log.error(logger, 'Failed initializing Places plugin:', e);
    }
    var pim = manager.getImportManager();
    var pfm = manager.getFileManager();

    // register file import method
    pfm.registerFileMethod(new ImportMethod(false));

    // kml
    pim.registerImportUI(mime.TYPE, new KMLPlacesImportUI());
    pim.registerImportUI(mime.KMZ_TYPE, new KMLPlacesImportUI());
    pim.registerImportDetails('KML/KMZ', true);

    // layer config
    LayerConfigManager.getInstance().registerLayerConfig(
        PlacesLayerConfig.ID, PlacesLayerConfig);

    // clear option
    ClearManager.getInstance().addEntry(new ClearEntry('places', 'Places', PlacesHide,
        'Clear all Places'));
  }

  /**
   * Get the global instance.
   * @return {!PlacesPlugin}
   */
  static getInstance() {
    if (!instance) {
      instance = new PlacesPlugin();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {PlacesPlugin} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {PlacesPlugin|undefined}
 */
let instance;

/**
 * Logger for the plugin.
 * @type {Logger}
 */
const logger = log.getLogger('plugin.places.PlacesPlugin');
