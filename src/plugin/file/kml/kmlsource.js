goog.provide('plugin.file.kml.KMLSource');
goog.require('goog.Timer');
goog.require('goog.async.Delay');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('goog.object');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.layer.Image');
goog.require('os.source.PropertyChange');
goog.require('os.source.Request');
goog.require('os.structs.TriState');
goog.require('os.ui.FeatureEditCtrl');
goog.require('os.ui.slick.column');
goog.require('plugin.file.kml.KMLImporter');
goog.require('plugin.file.kml.KMLParser');
goog.require('plugin.file.kml.KMLSourceEvent');



/**
 * @param {olx.source.VectorOptions=} opt_options OpenLayers vector source options.
 * @extends {os.source.Request}
 * @constructor
 */
plugin.file.kml.KMLSource = function(opt_options) {
  plugin.file.kml.KMLSource.base(this, 'constructor', opt_options);
  this.log = plugin.file.kml.KMLSource.LOGGER_;

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
   * @type {plugin.file.kml.ui.KMLNode}
   * @protected
   */
  this.rootNode = null;

  /**
   * A map of feature id's to KML tree node
   * @type {!Object<string, (!plugin.file.kml.ui.KMLNode|undefined)>}
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
   * @type {goog.async.Delay}
   * @private
   */
  this.updateFromNodesTimer_ = new goog.async.Delay(this.updateVisibilityFromNodes, 50, this);

  /**
   * Whether or not we have gotten an update from the tree at least once
   * @type {boolean}
   * @private
   */
  this.treeInit_ = false;

  /**
   * The initial file, set by the layer config when constructing a new KML layer.
   * @type {?os.file.File}
   * @protected
   */
  this.file = null;

  /**
   * GroundOverlay data associated with this layer
   * @type {Array<os.layer.Image>}
   * @protected
   */
  this.images = [];

  /**
   * ScreenOverlay data asscociated with this layer
   * @type {Array<string>}
   * @protected
   */
  this.overlays = [];

  os.dispatcher.listen(os.ui.events.UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);
};
goog.inherits(plugin.file.kml.KMLSource, os.source.Request);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.file.kml.KMLSource.LOGGER_ = goog.log.getLogger('plugin.file.kml.KMLSource');


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.disposeInternal = function() {
  plugin.file.kml.KMLSource.base(this, 'disposeInternal');

  os.dispatcher.unlisten(os.ui.events.UIEventType.TOGGLE_UI, this.onToggleUI_, false, this);

  this.clearImages(true);
  this.clearOverlays(true);

  this.nodeMap_ = {};
  this.setRootNode(null);
};


/**
 * Listen for screen overlays being toggled off via the X button on the GUI
 * @param {os.ui.events.UIEvent} event The event
 * @private
 */
plugin.file.kml.KMLSource.prototype.onToggleUI_ = function(event) {
  if (this.nodeMap_[event.id]) {
    this.nodeMap_[event.id].setState(os.structs.TriState.OFF);
  }
};


/**
 * Get a new importer. This is used by network link nodes so they have their own importer.
 * @return {plugin.file.kml.KMLImporter}
 */
plugin.file.kml.KMLSource.prototype.createImporter = function() {
  return new plugin.file.kml.KMLImporter(new plugin.file.kml.KMLParser({}));
};


/**
 * Get the KML tree node for a feature.
 * @param {ol.Feature} feature The feature.
 * @return {plugin.file.kml.ui.KMLNode} The KML node, or null if not found.
 */
plugin.file.kml.KMLSource.prototype.getFeatureNode = function(feature) {
  if (feature) {
    var id = /** @type {string} */ (feature.getId());
    var node = this.nodeMap_[id] || null;

    if (node && node.getFeature() === feature) {
      return node;
    }
  }

  return null;
};


/**
 * Get the root KML tree node
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.file.kml.KMLSource.prototype.getRootNode = function() {
  return this.rootNode;
};


/**
 * Set the root KML tree node
 * @param {plugin.file.kml.ui.KMLNode} node
 */
plugin.file.kml.KMLSource.prototype.setRootNode = function(node) {
  if (this.rootNode && this.rootNode !== node) {
    // the root may not change after a merge parse, so only dispose if it has changed
    this.rootNode.dispose();
  }

  this.rootNode = node;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.addFeature = function(feature) {
  plugin.file.kml.KMLSource.base(this, 'addFeature', feature);

  if (!this.getVisible()) {
    this.hideFeatures([feature]);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.addFeatures = function(features) {
  plugin.file.kml.KMLSource.base(this, 'addFeatures', features);

  if (!this.getVisible()) {
    this.hideFeatures(features);
  }
};


/**
 * Keep track of kml image layers and add then to the map
 * @param {Array<os.layer.Image>} images
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.addImages = function(images) {
  for (var i = 0; i < images.length; i++) {
    os.MapContainer.getInstance().addLayer(images[i]);
    this.images.push(images[i]);
  }
};


/**
 * Keep track of kml screen overlays and add then to the map
 * @param {Array<string>} overlays
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.addOverlays = function(overlays) {
  for (var i = 0; i < overlays.length; i++) {
    this.overlays.push(overlays[i]);
  }
};


/**
 * Removes image layers in the passed array.
 * @param {Array<os.layer.Image>} images
 * @param {boolean} removeNode Don't remove the node if it's only a refresh
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.removeImages = function(images, removeNode) {
  for (var i = 0; i < images.length; i++) {
    var image = images[i];
    os.MapContainer.getInstance().removeLayer(image);
    goog.array.remove(this.images, image);

    if (removeNode) {
      this.removeNode(/** @type {string} */ (image.getId()));
    }
  }

  // clear image highlight in case the image was removed from the layers tree
  this.setHighlightedItems(null);
};


/**
 * Removes all overlays in the passed array.
 * @param {Array<string>} overlays
 * @param {boolean} removeNode Don't remove the node if it's only a refresh
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.removeOverlays = function(overlays, removeNode) {
  for (var i = 0; i < overlays.length; i++) {
    var overlay = overlays[i];
    var id = os.ui.window.getById(overlay);
    goog.array.remove(this.overlays, overlay);

    if (removeNode) {
      os.ui.window.close(id);
      this.removeNode(overlay);
    }
  }
};


/**
 * Clears the whole images array. Faster than removeOverlays due to no calls to goog.array.remove.
 * @param {boolean} removeNode Whether to remove nodes (false for refresh)
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.clearImages = function(removeNode) {
  for (var i = 0; i < this.images.length; i++) {
    var image = this.images[i];
    os.MapContainer.getInstance().removeLayer(image);

    if (removeNode) {
      this.removeNode(/** @type {string} */ (image.getId()));
    }
  }

  this.images = [];

  // clear image highlight in case the image was removed from the layers tree
  this.setHighlightedItems(null);
};


/**
 * Clears the whole overlays array. Faster than removeOverlays due to no calls to goog.array.remove.
 * @param {boolean} removeNode Whether to remove nodes (false for refresh)
 * @suppress {checkTypes}
 */
plugin.file.kml.KMLSource.prototype.clearOverlays = function(removeNode) {
  for (var i = 0; i < this.overlays.length; i++) {
    var overlay = this.overlays[i];
    var id = os.ui.window.getById(overlay);

    if (removeNode) {
      os.ui.window.close(id);
      this.removeNode(overlay);
    }
  }

  this.overlays = [];
};


/**
 * Adds KML nodes to the source. Any features referenced by the nodes will also be added.
 * @param {!Array<plugin.file.kml.ui.KMLNode>} nodes The KML nodes to add
 * @param {boolean=} opt_recurse If children should be added recursively
 */
plugin.file.kml.KMLSource.prototype.addNodes = function(nodes, opt_recurse) {
  var features = [];
  var images = [];
  var overlays = [];
  for (var i = 0, n = nodes.length; i < n; i++) {
    var node = nodes[i];
    if (node instanceof plugin.file.kml.ui.KMLNode) {
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

      var overlay = node.getOverlay();
      if (overlay) {
        id = /** @type {string} */ (node.getId());
        this.nodeMap_[id] = node;
        overlays.push(overlay);
      }
    }

    if (opt_recurse) {
      var children = /** @type {Array<plugin.file.kml.ui.KMLNode>} */ (node.getChildren());
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
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.onImportProgress = function(opt_event) {
  // KML parsing is about 30% faster in FF if this is done in one shot in the complete handler, instead of here. the
  // slowdown is caused by the renderer and parser competing for resources, since FF has a much slower canvas renderer.
  // moving this to the complete handler will prevent any features from displaying until the parser is done, instead of
  // displaying them piecemeal and providing the user with some feedback.
  if (this.importer) {
    // request source importer expects features, but this one returns KML nodes
    this.addNodes(/** @type {!Array<plugin.file.kml.ui.KMLNode>} */ (this.importer.getData()));
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.onImportComplete = function(opt_event) {
  this.setRootNode(this.importer.getRootNode());
  this.setMinRefreshPeriod(this.importer.getMinRefreshPeriod());

  if (!this.externalColumns) {
    var columns = this.importer.getColumns();
    if (columns) {
      // set columns on the source. {@link setColumns} may create new columns, so wait until after the call to sort and
      // dispatch the column event
      this.suppressEvents();
      this.setColumns(columns);
      this.enableEvents();

      this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLUMNS, this.columns));
    }
  } else if (this.columns) {
    // initialize column sort/widths if they have not yet been adjusted by the user
    if (!this.columns.some(os.ui.slick.column.isUserModified)) {
      this.columns.sort(os.ui.slick.column.autoSizeAndSortColumns);
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.COLUMNS, this.columns));
  }

  this.updateVisibilityFromNodes();

  plugin.file.kml.KMLSource.base(this, 'onImportComplete', opt_event);
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.removeFeature = function(feature) {
  this.removeNode(/** @type {string} */ (feature.getId()));

  // clear feature highlight in case the feature was removed from the layers tree
  this.setHighlightedItems(null);

  plugin.file.kml.KMLSource.base(this, 'removeFeature', feature);
};


/**
 * Remove the node based on the mapped ID
 * @param {string} id
 */
plugin.file.kml.KMLSource.prototype.removeNode = function(id) {
  if (this.disposeOnRemove_) {
    var node = this.nodeMap_[id];
    if (node) {
      if (node.getId() == id) {
        // get rid of the node
        this.nodeMap_[id] = undefined;

        // dispose first to remove listeners
        node.dispose();

        // then unlink from the parent
        var parent = node.getParent();
        if (parent) {
          parent.removeChild(node);
        }
      } else {
        // the node's ID changed as a result of a merge, so update the reference in the map
        this.nodeMap_[id] = undefined;
        this.nodeMap_[node.getId()] = node;
      }
    }
  }
};


/**
 * Clears all descendant features of a tree node, disposing of the nodes unless indicated otherwise. Disable node
 * disposal when refreshing a node (like network links) to allow merging the tree.
 * @param {!plugin.file.kml.ui.KMLNode} node The root node.
 * @param {boolean=} opt_dispose If feature nodes should be disposed on removal; defaults to false.
 */
plugin.file.kml.KMLSource.prototype.clearNode = function(node, opt_dispose) {
  this.disposeOnRemove_ = goog.isDef(opt_dispose) ? opt_dispose : false;

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

  // handle the unprocess queue immediately in case a network link is being refreshed
  this.unprocessNow();

  this.disposeOnRemove_ = true;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.processImmediate = function(feature) {
  os.ui.FeatureEditCtrl.updateFeatureStyle(feature);
  os.ui.FeatureEditCtrl.restoreFeatureLabels(feature);

  plugin.file.kml.KMLSource.base(this, 'processImmediate', feature);

  this.scheduleUpdateFromNodes();
};


/**
 * Schedules a visibility update from the tree
 */
plugin.file.kml.KMLSource.prototype.scheduleUpdateFromNodes = function() {
  this.updateFromNodesTimer_.start();
};


/**
 * @protected
 */
plugin.file.kml.KMLSource.prototype.updateVisibilityFromNodes = function() {
  var features = this.getFeatures();
  var toShow = [];
  var toHide = [];
  var node;

  for (var i = 0, n = features.length; i < n; i++) {
    var feature = features[i];
    var id = /** @type {string} */ (feature.getId());
    node = this.nodeMap_[id];

    if (node) {
      if (node.getState() == os.structs.TriState.ON) {
        toShow.push(feature);
      } else if (node.getState() == os.structs.TriState.OFF) {
        toHide.push(feature);
      }
    } else {
      goog.log.warning(this.log, 'Feature [' + id + '] is not in the KML tree!');
    }
  }

  for (var i = 0, n = this.images.length; i < n; i++) {
    var image = this.images[i];
    var id = /** @type {string} */ (image.getId());
    node = this.nodeMap_[id];

    if (node) {
      if (node.getState() == os.structs.TriState.ON) {
        image.setLayerVisible(true);
      } else if (node.getState() == os.structs.TriState.OFF) {
        image.setLayerVisible(false);
      }
    } else {
      goog.log.warning(this.log, 'Image [' + id + '] is not in the KML tree!');
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
};


/**
 * Sets the initial file on the source.
 * @param {?os.file.File} file
 */
plugin.file.kml.KMLSource.prototype.setFile = function(file) {
  this.file = file;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.updateFeaturesVisibility = function(features, visible) {
  plugin.file.kml.KMLSource.base(this, 'updateFeaturesVisibility', features, visible);

  if (this.treeInit_) {
    for (var i = 0, n = features.length; i < n; i++) {
      var feature = features[i];
      var id = /** @type {string} */ (feature.getId());
      if (id in this.nodeMap_) {
        this.nodeMap_[id].setStateOnly(visible ? os.structs.TriState.ON : os.structs.TriState.OFF);
      } else {
        goog.log.warning(this.log, 'Show/hide feature [' + id + '] is not in the KML tree!');
      }
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.refresh = function() {
  // clean up 'non-features'
  this.clearImages(false);
  this.clearOverlays(false);
  this.nodeMap_ = os.object.prune(this.nodeMap_);

  if (this.file) {
    // this block handles the case of the file being initially available from an import process and without it
    // the request source naively requests the file again (which is a waste and slow)
    this.doImport(this.file.getContent());
    this.file = null;
  } else {
    plugin.file.kml.KMLSource.base(this, 'refresh');
  }

  this.dispatchEvent(plugin.file.kml.KMLSourceEvent.REFRESH);
};


/**
 * KML sources are not lockable.
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.isLockable = function() {
  return false;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.setRefreshInterval = function(value) {
  var minRefresh = this.minRefreshPeriod / 1000;
  if (this.refreshInterval != value || this.refreshInterval < minRefresh) {
    this.refreshInterval = value;

    if (this.refreshTimer) {
      this.refreshTimer.unlisten(goog.Timer.TICK, this.onRefreshTimer, false, this);
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
        os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.WARNING);
      }

      this.refreshTimer = os.source.RefreshTimers[interval];

      if (!this.refreshTimer) {
        // didn't find one for that time, so make a new one and save it off
        this.refreshTimer = new goog.Timer(1000 * interval);
        os.source.RefreshTimers[interval] = this.refreshTimer;
      }

      this.refreshTimer.listen(goog.Timer.TICK, this.onRefreshTimer, false, this);
      this.refreshTimer.start();
    }

    this.dispatchEvent(new os.events.PropertyChangeEvent(os.source.PropertyChange.REFRESH_INTERVAL));
  }
};


/**
 * Get the minimum automatic refresh period for the source.
 * @return {number}
 */
plugin.file.kml.KMLSource.prototype.getMinRefreshPeriod = function() {
  return this.minRefreshPeriod;
};


/**
 * Set the minimum automatic refresh period for the source.
 * @param {number} value
 */
plugin.file.kml.KMLSource.prototype.setMinRefreshPeriod = function(value) {
  if (this.minRefreshPeriod != value) {
    this.minRefreshPeriod = Math.max(value, 0);
    if (this.refreshInterval < this.minRefreshPeriod / 1000) {
      this.setRefreshInterval(this.refreshInterval);
    }
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.isTimeEditEnabled = function() {
  return true;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.persist = function(opt_to) {
  var options = plugin.file.kml.KMLSource.base(this, 'persist', opt_to);
  options['minRefreshPeriod'] = this.minRefreshPeriod;
  return options;
};


/**
 * @inheritDoc
 */
plugin.file.kml.KMLSource.prototype.restore = function(config) {
  plugin.file.kml.KMLSource.base(this, 'restore', config);

  if (config['minRefreshPeriod']) {
    this.setMinRefreshPeriod(config['minRefreshPeriod']);
  }
};
