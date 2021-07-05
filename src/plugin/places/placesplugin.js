goog.module('plugin.places.PlacesPlugin');
goog.module.declareLegacyNamespace();

// Register directives with Angular
goog.require('plugin.places.ui.PlacesNodeUI');
goog.require('plugin.places.ui.PlacesUI');

const log = goog.require('goog.log');
const os = goog.require('os');
const LayerConfigManager = goog.require('os.layer.config.LayerConfigManager');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');
const ClearEntry = goog.require('os.ui.clear.ClearEntry');
const ClearManager = goog.require('os.ui.clear.ClearManager');
const ImportMethod = goog.require('os.ui.file.method.ImportMethod');
const mime = goog.require('plugin.file.kml.mime');
const places = goog.require('plugin.places');
const KMLPlacesImportUI = goog.require('plugin.places.KMLPlacesImportUI');
const PlacesHide = goog.require('plugin.places.PlacesHide');
const PlacesLayerConfig = goog.require('plugin.places.PlacesLayerConfig');
const PlacesManager = goog.require('plugin.places.PlacesManager');
const menu = goog.require('plugin.places.menu');

const Logger = goog.requireType('goog.log.Logger');


/**
 * Plugin that allows the user to manage saved features as a KML tree.
 */
class PlacesPlugin extends AbstractPlugin {
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
    var pim = os.placesImportManager;
    var pfm = os.placesFileManager;

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


exports = PlacesPlugin;
