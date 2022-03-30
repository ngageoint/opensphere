goog.declareModuleId('plugin.file.kml.AbstractKMLManager');

import {listen} from 'ol/src/events.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import ConfigEventType from '../../../os/config/eventtype.js';
import OsEventType from '../../../os/events/eventtype.js';
import FileStorage from '../../../os/file/filestorage.js';
import {createFromContent} from '../../../os/file/index.js';
import MapContainer from '../../../os/mapcontainer.js';
import PropertyChange from '../../../os/source/propertychange.js';
import KMLLayerConfig from './kmllayerconfig.js';

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const GoogEventTarget = goog.require('goog.events.EventTarget');
const GoogEventType = goog.require('goog.events.EventType');
const log = goog.require('goog.log');

/**
 * Abstract KML manager class for persistent layers (e.g. Places).
 * @abstract
 */
export default class AbstractKMLManager extends GoogEventTarget {
  /**
   * @param {Object<string, *>} options Layer options.
   */
  constructor(options) {
    super();

    /**
     * The logger.
     * @type {log.Logger}
     * @protected
     */
    this.log = log.getLogger(/** @type {string} */ (options['logger']));

    /**
     * Saved options object.
     * @type {Object}
     * @protected
     */
    this.options = options;

    /**
     * The KML string to save if we don't have any nodes yet.
     * @type {string}
     * @protected
     */
    this.EMPTY_CONTENT = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
      '<Document><name>' + options['title'] + '</name></Document></kml>';

    /**
     * The KML layer that we use.
     * @type {KMLLayer}
     * @private
     */
    this.layer_ = null;

    /**
     * The KML layer source.
     * @type {KMLSource}
     * @private
     */
    this.source_ = null;

    /**
     * The root note for our KML source. It's different from the 'kmlroot' node.
     * @type {KMLNode}
     * @private
     */
    this.root_ = null;

    /**
     * If the manager has finished loading.
     * @type {boolean}
     * @private
     */
    this.loaded_ = false;

    /**
     * If the manager tried saving empty KML to storage.
     * @type {boolean}
     * @private
     */
    this.savedEmpty_ = false;

    /**
     * If the manager failed to export.
     * @type {boolean}
     * @private
     */
    this.exportFailed_ = false;

    /**
     * Delay to dedupe saving data.
     * @type {Delay}
     * @private
     */
    this.saveDelay_ = new Delay(this.saveInternal, 250, this);

    this.sourceListenKey = null;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.clear();
  }

  /**
   * Initialize the manager, loading data from storage.
   */
  initialize() {
    FileStorage.getInstance().getFile(this.options['url']).addCallbacks(this.onFileReady, this.handleError_, this);
  }

  /**
   * If the manager has finished loading.
   * @return {boolean}
   */
  isLoaded() {
    return this.loaded_;
  }

  /**
   * Get the root node of our KML.
   * @return {KMLNode}
   */
  getRoot() {
    return this.root_;
  }

  /**
   * Get the KML layer.
   * @return {KMLLayer}
   */
  getLayer() {
    return this.layer_;
  }

  /**
   * Get the KML layer source.
   * @return {KMLSource}
   */
  getSource() {
    return this.source_;
  }

  /**
   * Check if the layer is already present on the map.
   * @return {boolean}
   * @private
   */
  isLayerPresent_() {
    return MapContainer.getInstance().getLayer(this.options['id']) != null;
  }

  /**
   * Add the layer to the map.
   */
  addLayer() {
    if (!this.isLayerPresent_() && this.layer_) {
      MapContainer.getInstance().addLayer(this.layer_);
    }
  }

  /**
   * Remove the layer from the map.
   */
  removeLayer() {
    if (this.layer_) {
      this.layer_.setRemovable(true);
      MapContainer.getInstance().removeLayer(this.layer_, false);
    }
  }

  /**
   * Gets the layer config for layer creation.
   * @return {KMLLayerConfig}
   * @protected
   */
  getLayerConfig() {
    return new KMLLayerConfig();
  }

  /**
   * Set up our layer from onFileReady.
   * @param {KMLLayer} layer The layer to setup.
   * @param {Object<string, *>} options The layer options
   * @protected
   */
  setupLayer(layer, options) {
    layer.setLayerOptions(options);
  }

  /**
   * Get the layer options.
   * @return {Object<string, *>}
   * @protected
   */
  getOptions() {
    return this.options;
  }

  /**
   * Handle the KML file and create the layer.
   * This should be overridden by subclasses for any specific layer setup necessary.
   *
   * @param {osFile} file The stored file
   * @protected
   */
  onFileReady(file) {
    if (file && file.getContent()) {
      const config = this.getLayerConfig();
      const options = this.getOptions();

      this.layer_ = /** @type {!KMLLayer} */ (config.createLayer(options));
      this.setupLayer(this.layer_, options);

      this.source_ = /** @type {KMLSource} */ (this.layer_.getSource());
      this.sourceListenKey = listen(this.source_, GoogEventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);

      if (!this.source_.isLoading()) {
        this.onSourceLoaded_();
      }
    } else if (!this.savedEmpty_) {
      this.savedEmpty_ = true;
      this.saveContent(this.EMPTY_CONTENT).addCallbacks(this.initialize, this.handleError_, this);
    } else {
      this.handleError_('Failed saving empty place content to storage.');
    }
  }

  /**
   * Log an error.
   * @param {string} msg The error message
   * @param {Error=} opt_error The caught error
   * @private
   */
  handleError_(msg, opt_error) {
    log.error(this.log, msg, opt_error);
  }

  /**
   * Clear all local data from the application.
   * @protected
   */
  clear() {
    this.removeLayer();
    dispose(this.layer_);
    this.layer_ = null;
    this.source_ = null;
    this.root_ = null;
  }

  /**
   * Save KML to storage.
   *
   * @param {!(ArrayBuffer|string)} content The file content
   * @return {!goog.async.Deferred} The deferred store request.
   * @protected
   */
  saveContent(content) {
    const file = createFromContent(this.options['title'], this.options['url'], undefined, content);
    return FileStorage.getInstance().storeFile(file, true);
  }

  /**
   * Get a KML tree exporter to save the layer.
   * @param {KMLNode} node The root node.
   * @return {KMLTreeExporter}
   * @protected
   * @abstract
   */
  createExporter(node) {
  }

  /**
   * Save layer data to storage.
   * @protected
   */
  saveInternal() {
    if (this.root_) {
      const exporter = this.createExporter(this.root_);
      exporter.setCompress(true);

      exporter.listenOnce(OsEventType.COMPLETE, this.onExportComplete_, false, this);
      exporter.listenOnce(OsEventType.ERROR, this.onExportError_, false, this);
      exporter.process();
    }
  }

  /**
   * Success callback when data is exported.
   * @param {Event} event
   * @private
   */
  onExportComplete_(event) {
    const exporter = /** @type {KMLTreeExporter} */ (event.target);
    const output = /** @type {ArrayBuffer|string} */ (exporter.getOutput() || '');
    exporter.dispose();

    if (output) {
      this.saveContent(output);
    } else {
      const title = this.options['title'];
      this.handleError_('Failed exporting ' + title + ' to browser storage. Content was empty.');

      if (!this.exportFailed_) {
        this.exportFailed_ = true;
        const target = new GoogEventTarget();
        const msg = 'There was a problem saving your ' + title + ' to browser storage. ' +
            title + ' will no longer save during the current session.' +
            '<br><br><b>You should export the layer to a file to ensure that they are not lost on refresh.</b>';
        AlertManager.getInstance().sendAlert(msg, undefined, undefined, undefined, target);
      }
    }
  }

  /**
   * Error callback when data fails to export.
   * @param {Event} event
   * @private
   */
  onExportError_(event) {
    const exporter = /** @type {KMLTreeExporter} */ (event.target);
    exporter.dispose();

    this.handleError_('Failed exporting ' + this.options['title'] + ' to browser storage.');
  }

  /**
   * Initialize a KML node.
   * @param {KMLNode} node The node
   * @protected
   */
  initializeNode(node) {
    if (node) {
      this.setCanAddChildren(node);
      if (node !== this.root_) {
        this.setCanEdit(node);
        this.setCanDragInternal(node);
        this.setCanRemove(node);
      }

      const children = node.getChildren();
      if (children) {
        for (let i = 0; i < children.length; i++) {
          this.initializeNode(/** @type {KMLNode} */ (children[i]));
        }
      }
    }
  }

  /**
   * Set if a node can have children added to it.
   * @param {KMLNode} node The node
   * @protected
   * @abstract
   */
  setCanAddChildren(node) {
  }

  /**
   * Set if a node can be edited.
   * @param {KMLNode} node The node
   * @protected
   * @abstract
   */
  setCanEdit(node) {
  }

  /**
   * Set if a node can be dragged in the layer.
   * @param {KMLNode} node The node
   * @protected
   * @abstract
   */
  setCanDragInternal(node) {
  }

  /**
   * Set if a node can be removed from the layer.
   * @param {KMLNode} node The node
   * @protected
   * @abstract
   */
  setCanRemove(node) {
  }

  /**
   * Handles source property change events.
   * @param {PropertyChangeEvent} event The property change event.
   * @private
   */
  onSourcePropertyChange_(event) {
    var p = event.getProperty();
    if (p === PropertyChange.LOADING) {
      if (!this.source_.isLoading()) {
        this.onSourceLoaded_();
      }
    } else if (this.saveDelay_) {
      if (p === PropertyChange.VISIBLE) {
        this.saveDelay_.start();
      } else if (p === PropertyChange.FEATURE_VISIBILITY || p === PropertyChange.FEATURES) {
        // only save if a list of changed features was provided. if not, it's a general refresh event and can be ignored.
        var newVal = event.getNewValue();
        var oldVal = event.getOldValue();
        if (newVal || oldVal) {
          this.saveDelay_.start();
        }
      }
    }
  }

  /**
   * Handle the source finishing load.
   * @private
   */
  onSourceLoaded_() {
    if (this.source_) {
      const rootNode = this.source_.getRootNode();
      const children = rootNode && rootNode.getChildren();

      if (children) {
        this.root_ = /** @type {KMLNode} */ (children[0]);

        if (this.root_) {
          this.initializeNode(this.root_);
          this.root_.collapsed = false;
          this.root_.listen(GoogEventType.PROPERTYCHANGE, this.onRootChange_, false, this);

          this.addLayer();
        }
      }

      if (!this.root_) {
        this.handleError_('Failed parsing root node.');

        if (!this.savedEmpty_) {
          this.savedEmpty_ = true;
          this.saveContent(this.EMPTY_CONTENT).addCallbacks(this.initialize, this.handleError_, this);
        }
      }

      this.loaded_ = true;
      this.dispatchEvent(ConfigEventType.LOADED);
    }
  }

  /**
   * Handles changes on the root node
   *
   * @param {PropertyChangeEvent} e The event
   * @private
   */
  onRootChange_(e) {
    // save the tree when something changes
    if (this.saveDelay_) {
      this.saveDelay_.start();
    }
  }
}
