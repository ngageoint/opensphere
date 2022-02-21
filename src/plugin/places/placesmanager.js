goog.declareModuleId('plugin.places.PlacesManager');

import ActionEventType from '../../os/action/eventtype.js';
import Settings from '../../os/config/settings.js';
import ZOrder from '../../os/data/zorder.js';
import * as dispatcher from '../../os/dispatcher.js';
import OsEventType from '../../os/events/eventtype.js';
import FileManager from '../../os/file/filemanager.js';
import {getLocalUrl} from '../../os/file/index.js';
import * as filterMime from '../../os/file/mime/filter.js';
import OSFilterImportUI from '../../os/filter/im/osfilterimportui.js';
import {noop} from '../../os/fn/fn.js';
import LayerType from '../../os/layer/layertype.js';
import MapContainer from '../../os/mapcontainer.js';
import {incrementResetTasks, decrementResetTasks} from '../../os/storage/storage.js';
import {DEFAULT_LAYER_COLOR} from '../../os/style/style.js';
import ImportEvent from '../../os/ui/im/importevent.js';
import ImportEventType from '../../os/ui/im/importeventtype.js';
import ImportManager from '../../os/ui/im/importmanager.js';
import ImportProcess from '../../os/ui/im/importprocess.js';
import AbstractKMLManager from '../file/kml/abstractkmlmanager.js';
import * as places from './places.js';
import PlacesLayerConfig from './placeslayerconfig.js';


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
 * These options should always take precedence over the base options or options saved from settings.
 * @type {!Object}
 */
export const ADMIN_OPTIONS = {
  'animate': true,
  'editable': true,
  'id': places.ID,
  'layerType': LayerType.REF,
  'load': true,
  'logger': 'plugin.places.PlacesManager',
  'showLabels': true,
  'showRoot': false,
  'title': places.TITLE,
  'type': PlacesLayerConfig.ID,
  'url': STORAGE_URL
};

/**
 * Base options that could potentially be changed by user interaction.
 * @type {!Object}
 */
export const BASE_OPTIONS = {
  'color': DEFAULT_LAYER_COLOR,
  'collapsed': true,
  'columns': places.SourceFields,
  'labels': places.getDefaultLabels()
};

/**
 * Get the initial layer options for the Saved Places layer.
 * @return {!Object}
 */
const getLayerOptions = () => {
  const savedOptions = /** @type {!Object} */ (Settings.getInstance().get(LAYER_OPTIONS, {}));
  return Object.assign({}, BASE_OPTIONS, savedOptions, ADMIN_OPTIONS);
};

/**
 * The PlacesManager instance.
 * @type {PlacesManager}
 */
let PlacesManagerInstance;


/**
 * Allows the user to manage saved features as a KML tree.
 */
export default class PlacesManager extends AbstractKMLManager {
  /**
   * @inheritDoc
   */
  constructor(options) {
    super(options);

    /**
     * The places import manager.
     * @type {ImportManager}
     * @protected
     */
    this.importManager = null;

    /**
     * The places file manager.
     * @type {FileManager}
     * @protected
     */
    this.fileManager = null;

    // clear storage when the reset event is fired
    dispatcher.getInstance().listen(OsEventType.RESET, this.onSettingsReset_, false, this);

    // // handle edit time change/cancel
    dispatcher.getInstance().listen(ActionEventType.SAVE_FEATURE, this.reindexTimeModel_, false, this);
    dispatcher.getInstance().listen(ActionEventType.RESTORE_FEATURE, this.reindexTimeModel_, false, this);
  }

  /**
   * @inheritDoc
   */
  initialize() {
    super.initialize();

    this.importManager = new ImportManager();
    this.importManager.registerImportUI(filterMime.TYPE, new OSFilterImportUI());

    this.fileManager = new FileManager();
  }

  /**
   * Get the places import manager.
   * @return {ImportManager}
   */
  getImportManager() {
    return this.importManager;
  }

  /**
   * Get the places file manager.
   * @return {FileManager}
   */
  getFileManager() {
    return this.fileManager;
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
    const importProcess = new ImportProcess(this.importManager, this.fileManager);
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
      Settings.getInstance().set(LAYER_OPTIONS, layer.persist());
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
      PlacesManagerInstance = new PlacesManager(getLayerOptions());
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
