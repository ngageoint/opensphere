goog.module('plugin.places.PlacesManager');
goog.module.declareLegacyNamespace();

goog.require('plugin.file.kml.ui');
goog.require('plugin.places.ui.placesNodeUIDirective');

const ActionEventType = goog.require('os.action.EventType');
const config = goog.require('os.config');
const ZOrder = goog.require('os.data.ZOrder');
const dispatcher = goog.require('os.Dispatcher');
const OsEventType = goog.require('os.events.EventType');
const {getLocalUrl} = goog.require('os.file');
const {noop} = goog.require('os.fn');
const LayerType = goog.require('os.layer.LayerType');
const MapContainer = goog.require('os.MapContainer');
const {merge} = goog.require('os.object');
const {incrementResetTasks, decrementResetTasks} = goog.require('os.storage');
const {DEFAULT_LAYER_COLOR} = goog.require('os.style');
const ImportEvent = goog.require('os.ui.im.ImportEvent');
const ImportEventType = goog.require('os.ui.im.ImportEventType');
const ImportProcess = goog.require('os.ui.im.ImportProcess');
const AbstractKMLManager = goog.require('plugin.file.kml.AbstractKMLManager');
const places = goog.require('plugin.places');
const PlacesLayerConfig = goog.require('plugin.places.PlacesLayerConfig');

const OsFile = goog.requireType('os.file.File');
const KMLLayer = goog.requireType('plugin.file.kml.KMLLayer');
const KMLSource = goog.requireType('plugin.file.kml.KMLSource');
const KMLNode = goog.requireType('plugin.file.kml.ui.KMLNode');


/**
 * The Places storage location.
 * @type {string}
 * @const
 */
const STORAGE_NAME = '//plugin.places';

/**
 * The Places local storage URL.
 * @type {string}
 * @const
 */
const STORAGE_URL = getLocalUrl(btoa(STORAGE_NAME));

/**
 * The setting name to save layer options.
 * @type {string}
 * @const
 */
const LAYER_OPTIONS = 'places.options';

/**
 * The PlacesManager instance.
 * @type {PlacesManager}
 */
let PlacesManagerInstance;


/**
 * Allows the user to manage saved features as a KML tree.
 */
class PlacesManager extends AbstractKMLManager {
  /**
   * @inheritDoc
   */
  constructor(options) {
    super(options);

    // clear storage when the reset event is fired
    dispatcher.getInstance().listen(OsEventType.RESET, this.onSettingsReset_, false, this);

    // // handle edit time change/cancel
    dispatcher.getInstance().listen(ActionEventType.SAVE_FEATURE, this.reindexTimeModel_, false, this);
    dispatcher.getInstance().listen(ActionEventType.RESTORE_FEATURE, this.reindexTimeModel_, false, this);
  }

  /**
   * Pass-through to getRoot.
   * @return {KMLNode}
   */
  getPlacesRoot() {
    return this.getRoot();
  }

  /**
   * Pass-through to getLayer.
   * @return {KMLLayer}
   */
  getPlacesLayer() {
    return this.getLayer();
  }

  /**
   * Pass-through to getSource.
   * @return {KMLSource}
   */
  getPlacesSource() {
    return this.getSource();
  }

  /**
   * @inheritDoc
   */
  addLayer() {
    const layer = this.getLayer();
    const root = this.getRoot();
    const id = this.options['id'];

    if (!places.isLayerPresent() && layer) {
      // don't allow removing the layer via the UI
      layer.setRemovable(false);

      if (root) {
        // the old KML visibility logic caused the layer 'visible' flag to be set to false if all places were removed,
        // even if the checkbox was toggled on. we don't want to initialize the layer as hidden if this is the case, so
        // always show the layer if there aren't any children.
        const children = root.getChildren();
        if (!children || !children.length) {
          layer.setLayerVisible(true);
        }
      }

      const z = ZOrder.getInstance();
      const zType = z.getZType(id);

      MapContainer.getInstance().addLayer(layer);

      if (!zType) {
        // when adding the places layer for the first time, make sure it is at a lower z-index than the drawing layer
        z.moveBefore(id, MapContainer.DRAW_ID);
        z.update();
        z.save();
      }
    }
  }

  /**
   * Start the places import process.
   * @param {OsFile=} opt_file Optional file to use in the import.
   */
  startImport(opt_file) {
    const importProcess = new ImportProcess(os.placesImportManager, os.placesFileManager);
    importProcess.setEvent(new ImportEvent(ImportEventType.FILE, opt_file, undefined));
    importProcess.begin();
  }

  /**
   * @inheritDoc
   */
  getLayerConfig() {
    return new PlacesLayerConfig();
  }

  /**
   * @inheritDoc
   */
  setupLayer(layer, options) {
    layer.setRemovable(false);
    layer.setSticky(true);

    super.setupLayer(layer, options);

    layer.setExplicitType('');
    layer.setLayerUI('');
    layer.setNodeUI('<placesnodeui></placesnodeui>');
    layer.renderLegend = noop;
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    const options = this.options;
    // see if any layer options were persisted to settings
    const saved = /** @type {?Object} */ (os.settings.get(LAYER_OPTIONS));
    if (saved) {
      merge(saved, options, true);
    }

    return options;
  }

  /**
   * Clears the storage key when application settings are reset.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onSettingsReset_(event) {
    // clear local data
    this.clear();

    // clear stored data
    incrementResetTasks();
    this.saveContent(this.EMPTY_CONTENT).addCallbacks(decrementResetTasks, decrementResetTasks);
  }

  /**
   * @override
   */
  createExporter(node) {
    return places.createExporter(node);
  }

  /**
   * @inheritDoc
   */
  saveInternal() {
    super.saveInternal();

    const layer = this.getLayer();
    if (layer) {
      os.settings.set(LAYER_OPTIONS, layer.persist());
    }
  }

  /**
   * @override
   */
  setCanAddChildren(node) {
    node.canAddChildren = node.isFolder();
  }

  /**
   * @override
   */
  setCanEdit(node) {
    node.editable = true;
  }

  /**
   * @override
   */
  setCanDragInternal(node) {
    node.internalDrag = true;
  }

  /**
   * @override
   */
  setCanRemove(node) {
    node.removable = true;
  }

  /**
   * Reindex the source time model
   * @private
   */
  reindexTimeModel_() {
    this.getSource().reindexTimeModel();
  }

  /**
   * Get the root annotations folder. Currently, this is just the overall root.
   * @return {KMLNode}
   */
  getAnnotationsFolder() {
    return this.getRoot();
  }

  /**
   * Get a singleton instance of the PlacesManager.
   * @return {!PlacesManager}
   */
  static getInstance() {
    if (!PlacesManagerInstance) {
      const OPTIONS = {
        'animate': true,
        'color': DEFAULT_LAYER_COLOR,
        'collapsed': true,
        'columns': places.SourceFields,
        'editable': true,
        'id': places.ID,
        'layerType': LayerType.REF,
        'load': true,
        'logger': 'plugin.places.PlacesManager',
        'provider': config.getAppName() || null,
        'showLabels': false,
        'showRoot': false,
        'title': places.TITLE,
        'type': PlacesLayerConfig.ID,
        'url': STORAGE_URL
      };

      PlacesManagerInstance = new PlacesManager(OPTIONS);
    }

    return PlacesManagerInstance;
  }

  /**
   * Set a singleton instance of the PlacesManager.
   * @param {!PlacesManager} value The singleton instance.
   */
  static setInstance(value) {
    PlacesManagerInstance = value;
  }
}

exports = PlacesManager;
