goog.declareModuleId('plugin.file.kml.KMLSource');

import {remove} from 'ol/src/array.js';
import AlertEventSeverity from '../../../os/alert/alerteventseverity.js';
import AlertManager from '../../../os/alert/alertmanager.js';
import * as dispatcher from '../../../os/dispatcher.js';
import PropertyChangeEvent from '../../../os/events/propertychangeevent.js';
import MapContainer from '../../../os/mapcontainer.js';
import * as osObject from '../../../os/object/object.js';
import PropertyChange from '../../../os/source/propertychange.js';
import RequestSource from '../../../os/source/requestsource.js';
import * as source from '../../../os/source/source.js';
import TriState from '../../../os/structs/tristate.js';
import UIEventType from '../../../os/ui/events/uieventtype.js';
import {Controller as FeatureEditCtrl} from '../../../os/ui/featureedit.js';
import * as column from '../../../os/ui/slick/column.js';
import * as osWindow from '../../../os/ui/window.js';
import KMLImporter from './kmlimporter.js';
import KMLParser from './kmlparser.js';
import KMLSourceEvent from './kmlsourceevent.js';
import KMLNode from './ui/kmlnode.js';

const Timer = goog.require('goog.Timer');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');


/**
 */
export default class KMLSource extends RequestSource {
  /**
   * Constructor.
   * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
   */
  constructor(opt_options) {
    super(opt_options);
    this.log = logger;

    /**
     * Minimum time for how often the source will automatically refresh itself.
     * @type {number}
     * @protected
     */
    this.minRefreshPeriod = 0;

    // KML features are more likely to vary which columns are available, so test more of them when auto detecting columns
    this.columnAutoDetectLimit = 100;

    /**
     * The root KML node
     * @type {KMLNode}
     * @protected
     */
    this.rootNode = null;

    /**
     * A map of feature id's to KML tree node
     * @type {!Object<string, (!KMLNode|undefined)>}
     * @private
     */
    this.nodeMap_ = {};

    /**
     * If node visibility should be updated when a feature is removed
     * @type {boolean}
     * @private
     */
    this.disposeOnRemove_ = true;

    /**
     * Timer for updating all the visibility from the tree at once
     * @type {Delay}
     * @private
     */
    this.updateFromNodesTimer_ = new Delay(this.updateVisibilityFromNodes, 50, this);

    /**
     * Whether or not we have gotten an update from the tree at least once
     * @type {boolean}
     * @private
     */
    this.treeInit_ = false;

    /**
     * The initial file, set by the layer config when constructing a new KML layer.
     * @type {?OSFile}
     * @protected
     */
    this.file = null;

    /**
     * GroundOverlay data associated with this layer
     * @type {Array<Image>}
     * @protected
     */
    this.images = [];

    /**
     * ScreenOverlay data asscociated with this layer
     * @type {Array<string>}
     * @protected
     */
    this.overlays = [];

    dispatcher.getInstance().listen(UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    dispatcher.getInstance().unlisten(UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);

    this.clearImages(true);
    this.clearOverlays(true);

    this.nodeMap_ = {};
    this.setRootNode(null);
  }

  /**
   * Listen for screen overlays being toggled off via the X button on the GUI
   *
   * @param {UIEvent} event The event
   * @private
   */
  onToggleUI_(event) {
    if (this.nodeMap_[event.id]) {
      this.nodeMap_[event.id].setState(TriState.OFF);
    }
  }

  /**
   * Get a new importer. This is used by network link nodes so they have their own importer.
   *
   * @return {KMLImporter}
   */
  createImporter() {
    return new KMLImporter(new KMLParser({}));
  }

  /**
   * Get the KML tree node for a feature.
   *
   * @param {ol.Feature} feature The feature.
   * @return {KMLNode} The KML node, or null if not found.
   */
  getFeatureNode(feature) {
    if (feature) {
      var id = /** @type {string} */ (feature.getId());
      var node = this.nodeMap_[id] || null;

      if (node && node.getFeature() === feature) {
        return node;
      }
    }

    return null;
  }

  /**
   * Get the root KML tree node
   *
   * @return {KMLNode}
   */
  getRootNode() {
    return this.rootNode;
  }

  /**
   * Set the root KML tree node
   *
   * @param {KMLNode} node
   */
  setRootNode(node) {
    if (this.rootNode && this.rootNode !== node) {
      // the root may not change after a merge parse, so only dispose if it has changed
      this.rootNode.dispose();
    }

    this.rootNode = node;
  }

  /**
   * @inheritDoc
   */
  setEnabledInternal(value) {
    if (!value) {
      // when the layer is disabled, drop reference to the root node to save memory
      this.setRootNode(null);
    }

    super.setEnabledInternal(value);
  }

  /**
   * @inheritDoc
   */
  addFeature(feature) {
    super.addFeature(feature);

    if (!this.getVisible()) {
      this.hideFeatures([feature]);
    }
  }

  /**
   * @inheritDoc
   */
  addFeatures(features) {
    super.addFeatures(features);

    if (!this.getVisible()) {
      this.hideFeatures(features);
    }
  }

  /**
   * Keep track of kml image layers and add then to the map
   *
   * @param {Array<Image>} images
   * @suppress {checkTypes}
   */
  addImages(images) {
    for (var i = 0; i < images.length; i++) {
      MapContainer.getInstance().addLayer(images[i]);
      this.images.push(images[i]);
    }
  }

  /**
   * Keep track of kml screen overlays and add then to the map
   *
   * @param {Array<string>} overlays
   * @suppress {checkTypes}
   */
  addOverlays(overlays) {
    for (var i = 0; i < overlays.length; i++) {
      this.overlays.push(overlays[i]);
    }
  }

  /**
   * Removes image layers in the passed array.
   *
   * @param {Array<Image>} images
   * @param {boolean} removeNode Don't remove the node if it's only a refresh
   * @suppress {checkTypes}
   */
  removeImages(images, removeNode) {
    for (var i = 0; i < images.length; i++) {
      var image = images[i];
      MapContainer.getInstance().removeLayer(image);
      remove(this.images, image);

      if (removeNode) {
        this.removeNode(/** @type {string} */ (image.getId()));
      }
    }

    // clear image highlight in case the image was removed from the layers tree
    this.setHighlightedItems(null);
  }

  /**
   * Removes all overlays in the passed array.
   *
   * @param {Array<string>} overlays
   * @param {boolean} removeNode Don't remove the node if it's only a refresh
   * @suppress {checkTypes}
   */
  removeOverlays(overlays, removeNode) {
    for (var i = 0; i < overlays.length; i++) {
      var overlay = overlays[i];
      var id = osWindow.getById(overlay);
      remove(this.overlays, overlay);

      if (removeNode) {
        osWindow.close(id);
        this.removeNode(overlay);
      }
    }
  }

  /**
   * Clears the whole images array. Faster than removeOverlays due to no calls to olArray.remove.
   *
   * @param {boolean} removeNode Whether to remove nodes (false for refresh)
   * @suppress {checkTypes}
   */
  clearImages(removeNode) {
    for (var i = 0; i < this.images.length; i++) {
      var image = this.images[i];
      MapContainer.getInstance().removeLayer(image);

      if (removeNode) {
        this.removeNode(/** @type {string} */ (image.getId()));
      }
    }

    this.images = [];

    // clear image highlight in case the image was removed from the layers tree
    this.setHighlightedItems(null);
  }

  /**
   * Clears the whole overlays array. Faster than removeOverlays due to no calls to olArray.remove.
   *
   * @param {boolean} removeNode Whether to remove nodes (false for refresh)
   * @suppress {checkTypes}
   */
  clearOverlays(removeNode) {
    for (var i = 0; i < this.overlays.length; i++) {
      var overlay = this.overlays[i];
      var id = osWindow.getById(overlay);

      if (removeNode) {
        osWindow.close(id);
        this.removeNode(overlay);
      }
    }

    this.overlays = [];
  }

  /**
   * Adds KML nodes to the source. Any features referenced by the nodes will also be added.
   *
   * @param {!Array<KMLNode>} nodes The KML nodes to add
   * @param {boolean=} opt_recurse If children should be added recursively
   */
  addNodes(nodes, opt_recurse) {
    var features = [];
    var images = [];
    var overlays = [];
    for (var i = 0, n = nodes.length; i < n; i++) {
      var node = nodes[i];
      if (node instanceof KMLNode) {
        node.setSource(this);
        var id;

        var feature = node.getFeature();
        if (feature) {
          // always replace the node in the map in case it changed. the old node will be disposed by the parser.
          id = /** @type {string} */ (node.getId());
          this.nodeMap_[id] = node;

          features.push(feature);
        }

        var image = node.getImage();
        if (image) {
          // always replace the node in the map in case it changed. the old node will be disposed by the parser.
          id = /** @type {string} */ (node.getId());
          this.nodeMap_[id] = node;

          images.push(image);
        }

        var overlay = node.getOverlayId();
        if (overlay) {
          id = /** @type {string} */ (node.getId());
          this.nodeMap_[id] = node;
          overlays.push(overlay);
        }

        node.loadAnnotation();
      }

      if (opt_recurse) {
        var children = /** @type {Array<KMLNode>} */ (node.getChildren());
        if (children && children.length > 0) {
          this.addNodes(children, true);
        }
      }
    }

    if (features.length > 0) {
      this.addFeatures(features);
    }

    if (images.length > 0) {
      this.addImages(images);
    }

    if (overlays.length > 0) {
      this.addOverlays(overlays);
    }
  }

  /**
   * @inheritDoc
   */
  onImportProgress(opt_event) {
    this.clearQueue();

    // KML parsing is about 30% faster in FF if this is done in one shot in the complete handler, instead of here. the
    // slowdown is caused by the renderer and parser competing for resources, since FF has a much slower canvas renderer.
    // moving this to the complete handler will prevent any features from displaying until the parser is done, instead of
    // displaying them piecemeal and providing the user with some feedback.
    if (this.importer) {
      // request source importer expects features, but this one returns KML nodes
      this.addNodes(/** @type {!Array<KMLNode>} */ (this.importer.getData()));
    }
  }

  /**
   * @inheritDoc
   */
  onImportComplete(opt_event) {
    const kmlImporter = /** @type {KMLImporter} */ (this.importer);

    this.setRootNode(kmlImporter.getRootNode());
    this.setMinRefreshPeriod(kmlImporter.getMinRefreshPeriod());

    if (!this.externalColumns) {
      var columns = kmlImporter.getColumns();
      if (columns) {
        // set columns on the source. {@link setColumns} may create new columns, so wait until after the call to sort and
        // dispatch the column event
        this.suppressEvents();
        this.setColumns(columns);
        this.enableEvents();

        this.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLUMNS, this.columns));
      }
    } else if (this.columns) {
      // initialize column sort/widths if they have not yet been adjusted by the user
      if (!this.columns.some(column.isUserModified)) {
        this.columns.sort(column.autoSizeAndSortColumns);
      }

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.COLUMNS, this.columns));
    }

    this.updateVisibilityFromNodes();

    super.onImportComplete(opt_event);
  }

  /**
   * @inheritDoc
   */
  clearQueue() {
    for (var key in this.nodeMap_) {
      var node = this.nodeMap_[key];
      if (node && node.isDisposed()) {
        this.nodeMap_[key] = undefined;
      }
    }

    this.nodeMap_ = osObject.prune(this.nodeMap_);

    super.clearQueue();
  }

  /**
   * @inheritDoc
   */
  removeFeature(feature) {
    this.removeNode(/** @type {string} */ (feature.getId()));

    // clear feature highlight in case the feature was removed from the layers tree
    this.setHighlightedItems(null);

    super.removeFeature(feature);
  }

  /**
   * Remove the node based on the mapped ID
   *
   * @param {string} id
   */
  removeNode(id) {
    if (this.disposeOnRemove_) {
      var node = this.nodeMap_[id];
      if (node) {
        this.nodeMap_[id] = undefined;

        if (!node.isDisposed()) {
          if (node.getId() == id) {
            // dispose first to remove listeners
            node.dispose();

            // then unlink from the parent
            var parent = node.getParent();
            if (parent) {
              parent.removeChild(node);
            }
          } else {
            // the node's ID changed as a result of a merge, so update the reference in the map
            this.nodeMap_[node.getId()] = node;
          }
        }
      }
    }
  }

  /**
   * Clears all descendant features of a tree node, disposing of the nodes unless indicated otherwise. Disable node
   * disposal when refreshing a node (like network links) to allow merging the tree.
   *
   * @param {!KMLNode} node The root node.
   * @param {boolean=} opt_dispose If feature nodes should be disposed on removal; defaults to false.
   */
  clearNode(node, opt_dispose) {
    this.disposeOnRemove_ = opt_dispose !== undefined ? opt_dispose : false;

    // handle the process queue in case we're removing features lingering inside of it
    this.processNow();

    var features = node.getFeatures(true);
    if (features && features.length > 0) {
      this.removeFeatures(features);
    }

    var images = node.getImages(true);
    if (images && images.length > 0) {
      this.removeImages(images, true);
    }

    var overlays = node.getOverlays(true);
    if (overlays && overlays.length > 0) {
      this.removeOverlays(overlays, true);
    }

    node.clearAnnotations();

    // handle the unprocess queue immediately in case a network link is being refreshed
    this.unprocessNow();

    this.disposeOnRemove_ = true;
  }

  /**
   * @inheritDoc
   */
  processImmediate(feature) {
    FeatureEditCtrl.updateFeatureStyle(feature);
    FeatureEditCtrl.restoreFeatureLabels(feature);

    super.processImmediate(feature);

    if (this.animationOverlay) {
      var node = this.getFeatureNode(feature);
      if (node) {
        node.setAnimationState(false);
      }
    }

    this.scheduleUpdateFromNodes();
  }

  /**
   * Schedules a visibility update from the tree
   */
  scheduleUpdateFromNodes() {
    this.updateFromNodesTimer_.start();
  }

  /**
   * @protected
   */
  updateVisibilityFromNodes() {
    var features = this.getFeatures();
    var toShow = [];
    var toHide = [];
    var node;

    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      var id = /** @type {string} */ (feature.getId());
      node = this.nodeMap_[id];

      if (node) {
        if (node.getState() == TriState.ON) {
          toShow.push(feature);
        } else if (node.getState() == TriState.OFF) {
          toHide.push(feature);
        }
      } else {
        log.warning(this.log, 'Feature [' + id + '] is not in the KML tree!');
      }
    }

    if (toShow.length) {
      this.showFeatures(toShow);
    }

    if (toHide.length) {
      this.hideFeatures(toHide);
      this.removeFromSelected(toHide);
    }

    this.treeInit_ = true;
  }

  /**
   * Sets the initial file on the source.
   *
   * @param {?OSFile} file
   */
  setFile(file) {
    this.file = file;
  }

  /**
   * @inheritDoc
   */
  updateFeaturesVisibility(features, visible) {
    super.updateFeaturesVisibility(features, visible);

    if (this.treeInit_) {
      for (var i = 0, n = features.length; i < n; i++) {
        var feature = features[i];
        var id = /** @type {string} */ (feature.getId());
        if (id in this.nodeMap_) {
          this.nodeMap_[id].setStateOnly(visible ? TriState.ON : TriState.OFF);
        } else {
          log.warning(this.log, 'Show/hide feature [' + id + '] is not in the KML tree!');
        }
      }
    }
  }

  /**
   * @inheritDoc
   */
  clear() {
    super.clear();

    // Drop everything, clear the root node, then dispose of it. The KML will be parsed again on refresh.
    this.clearImages(true);
    this.clearOverlays(true);
    this.nodeMap_ = {};

    this.setRootNode(null);
    dispose(this.rootNode);
  }

  /**
   * @inheritDoc
   */
  refresh() {
    // clean up 'non-features'
    this.clearImages(false);
    this.clearOverlays(false);
    this.nodeMap_ = osObject.prune(this.nodeMap_);

    if (this.file) {
      // this block handles the case of the file being initially available from an import process and without it
      // the request source naively requests the file again (which is a waste and slow)
      this.doImport(this.file.getContent());
      this.file = null;
    } else {
      super.refresh();
    }

    this.dispatchEvent(KMLSourceEvent.REFRESH);
  }

  /**
   * KML sources are not lockable.
   *
   * @inheritDoc
   */
  isLockable() {
    return false;
  }

  /**
   * @inheritDoc
   */
  setRefreshInterval(value) {
    var minRefresh = this.minRefreshPeriod / 1000;
    if (this.refreshInterval != value || this.refreshInterval < minRefresh) {
      this.refreshInterval = value;

      if (this.refreshTimer) {
        this.refreshTimer.unlisten(Timer.TICK, this.onRefreshTimer, false, this);
        if (!this.refreshTimer.hasListener()) {
          // nobody's listening, so stop it
          this.refreshTimer.stop();
        }
      }

      this.refreshTimer = null;

      if (this.refreshInterval > 0) {
        var interval = Math.max(value, minRefresh);
        if (interval != value) {
          var msg = 'The selected refresh period is lower than the minimum (' + minRefresh + ' seconds) allowed by ' +
              'the KML. The minimum will be used instead.';
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.WARNING);
        }

        this.refreshTimer = source.RefreshTimers[interval];

        if (!this.refreshTimer) {
          // didn't find one for that time, so make a new one and save it off
          this.refreshTimer = new Timer(1000 * interval);
          source.RefreshTimers[interval] = this.refreshTimer;
        }

        this.refreshTimer.listen(Timer.TICK, this.onRefreshTimer, false, this);
        this.refreshTimer.start();
      }

      this.dispatchEvent(new PropertyChangeEvent(PropertyChange.REFRESH_INTERVAL));
    }
  }

  /**
   * Get the minimum automatic refresh period for the source.
   *
   * @return {number}
   */
  getMinRefreshPeriod() {
    return this.minRefreshPeriod;
  }

  /**
   * Set the minimum automatic refresh period for the source.
   *
   * @param {number} value
   */
  setMinRefreshPeriod(value) {
    if (this.minRefreshPeriod != value) {
      this.minRefreshPeriod = Math.max(value, 0);
      if (this.refreshInterval < this.minRefreshPeriod / 1000) {
        this.setRefreshInterval(this.refreshInterval);
      }
    }
  }

  /**
   * @inheritDoc
   */
  setVisible(value) {
    super.setVisible(value);

    if (this.rootNode) {
      this.rootNode.updateVisibility(true);
    }
  }

  /**
   * @inheritDoc
   */
  isTimeEditEnabled() {
    return true;
  }

  /**
   * @inheritDoc
   */
  persist(opt_to) {
    var options = super.persist(opt_to);
    options['minRefreshPeriod'] = this.minRefreshPeriod;
    return options;
  }

  /**
   * @inheritDoc
   */
  restore(config) {
    super.restore(config);

    if (config['minRefreshPeriod']) {
      this.setMinRefreshPeriod(config['minRefreshPeriod']);
    }
  }

  /**
   * Creates a basic feature overlay used to animate features on the map.
   *
   * @protected
   * @override
   */
  createAnimationOverlay() {
    super.createAnimationOverlay();

    // hide all features
    var features = this.getFeatures();
    for (var i = 0, n = features.length; i < n; i++) {
      var node = this.getFeatureNode(features[i]);
      if (node) {
        node.setAnimationState(false);
      }
    }
  }

  /**
   * Updates features displayed by the animation overlay if it exists.
   *
   * @protected
   * @override
   */
  updateAnimationOverlay() {
    if (this.animationOverlay) {
      // hide features from the previous animation frame
      var overlayFeatures = this.animationOverlay.getFeatures();
      for (var i = 0, n = overlayFeatures.length; i < n; i++) {
        var node = this.getFeatureNode(overlayFeatures[i]);
        if (node) {
          node.setAnimationState(false);
        }
      }
    }

    super.updateAnimationOverlay();

    if (this.animationOverlay) {
      // show features in the current animation frame
      var overlayFeatures = this.animationOverlay.getFeatures();
      for (var i = 0, n = overlayFeatures.length; i < n; i++) {
        var node = this.getFeatureNode(overlayFeatures[i]);
        if (node) {
          node.setAnimationState(true);
        }
      }
    }
  }

  /**
   * Disposes of the animation overlay and cached features.
   *
   * @protected
   * @override
   */
  disposeAnimationOverlay() {
    super.disposeAnimationOverlay();

    // show all features
    var features = this.getFeatures();
    for (var i = 0, n = features.length; i < n; i++) {
      var node = this.getFeatureNode(features[i]);
      if (node) {
        node.setAnimationState(true);
      }
    }
  }
}

/**
 * Logger
 * @type {Logger}
 */
const logger = log.getLogger('plugin.file.kml.KMLSource');
