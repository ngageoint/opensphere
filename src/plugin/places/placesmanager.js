goog.provide('plugin.places.PlacesManager');

goog.require('goog.async.Delay');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('os.object');
goog.require('os.ui.im.ImportEvent');
goog.require('plugin.file.kml.KMLLayerConfig');
goog.require('plugin.file.kml.ui');
goog.require('plugin.file.kml.ui.KMLNode');
goog.require('plugin.places');
goog.require('plugin.places.ui.placesNodeUIDirective');



/**
 * Allows the user to manage saved features as a KML tree.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
plugin.places.PlacesManager = function() {
  plugin.places.PlacesManager.base(this, 'constructor');

  /**
   * The logger
   * @type {goog.log.Logger}
   * @private
   */
  this.log_ = plugin.places.PlacesManager.LOGGER_;

  /**
   * @type {plugin.file.kml.KMLLayer}
   * @private
   */
  this.placesLayer_ = null;

  /**
   * @type {plugin.file.kml.KMLSource}
   * @private
   */
  this.placesSource_ = null;

  /**
   * @type {plugin.file.kml.ui.KMLNode}
   * @private
   */
  this.placesRoot_ = null;

  /**
   * If the manager has finished loading places.
   * @type {boolean}
   * @private
   */
  this.loaded_ = false;

  /**
   * If the manager tried saving empty places to storage.
   * @type {boolean}
   * @private
   */
  this.savedEmpty_ = false;

  /**
   * Delay to dedupe saving data.
   * @type {goog.async.Delay}
   * @private
   */
  this.saveDelay_ = new goog.async.Delay(this.saveInternal_, 250, this);

  // clear storage when the reset event is fired
  os.dispatcher.listen(os.events.EventType.RESET, this.onSettingsReset_, false, this);
};
goog.inherits(plugin.places.PlacesManager, goog.events.EventTarget);
goog.addSingletonGetter(plugin.places.PlacesManager);


/**
 * Logger for plugin.places.PlacesManager
 * @type {goog.log.Logger}
 * @private
 * @const
 */
plugin.places.PlacesManager.LOGGER_ = goog.log.getLogger('plugin.places.PlacesManager');


/**
 * The storage key used for places.
 * @type {string}
 * @const
 */
plugin.places.PlacesManager.STORAGE_NAME = '//plugin.places';


/**
 * The storage key used for places.
 * @type {string}
 * @const
 */
plugin.places.PlacesManager.STORAGE_URL = os.file.getLocalUrl('//plugin.places');


/**
 * @type {string}
 * @const
 */
plugin.places.PlacesManager.LAYER_OPTIONS = 'places.options';


/**
 * The storage key used for places.
 * @type {string}
 * @const
 */
plugin.places.PlacesManager.EMPTY_CONTENT = '<kml xmlns="http://www.opengis.net/kml/2.2">' +
    '<Document><name>' + plugin.places.TITLE + '</name></Document></kml>';


/**
 * Source events that should trigger saving places.
 * @type {!Array<string>}
 * @const
 */
plugin.places.PlacesManager.SOURCE_SAVE_EVENTS = [
  os.source.PropertyChange.FEATURES,
  os.source.PropertyChange.FEATURE_VISIBILITY
];


/**
 * @inheritDoc
 */
plugin.places.PlacesManager.prototype.disposeInternal = function() {
  plugin.places.PlacesManager.base(this, 'disposeInternal');
  this.clearPlaces_();
};


/**
 * Initialize the manager, loading data from storage.
 */
plugin.places.PlacesManager.prototype.initialize = function() {
  os.file.FileStorage.getInstance().getFile(plugin.places.PlacesManager.STORAGE_URL)
      .addCallbacks(this.onFileReady_, this.handleError_, this);
};


/**
 * If the manager has finished loading.
 * @return {boolean}
 */
plugin.places.PlacesManager.prototype.isLoaded = function() {
  return this.loaded_;
};


/**
 * Get the places KML root node.
 * @return {plugin.file.kml.ui.KMLNode}
 */
plugin.places.PlacesManager.prototype.getPlacesRoot = function() {
  return this.placesRoot_;
};


/**
 * Add the Places layer to the map.
 */
plugin.places.PlacesManager.prototype.addLayer = function() {
  if (!plugin.places.isLayerPresent() && this.placesLayer_) {
    // don't allow removing the layer via the UI
    this.placesLayer_.setRemovable(false);

    var z = os.data.ZOrder.getInstance();
    var zType = z.getZType(plugin.places.ID);

    os.MapContainer.getInstance().addLayer(this.placesLayer_);

    if (!zType) {
      // when adding the places layer for the first time, make sure it is at a lower z-index than the drawing layer
      z.moveBefore(plugin.places.ID, os.MapContainer.DRAW_ID);
      z.update();
      z.save();
    }
  }
};


/**
 * Remove the Places layer from the map.
 */
plugin.places.PlacesManager.prototype.removeLayer = function() {
  if (this.placesLayer_) {
    this.placesLayer_.setRemovable(true);

    // remove it from the map but don't dispose of it so we still have the tree available
    os.MapContainer.getInstance().removeLayer(this.placesLayer_, false);
  }
};


/**
 * Start the places import process.
 */
plugin.places.PlacesManager.prototype.startImport = function() {};


/**
 * Handle the file.
 * @param {os.file.File} file The stored file
 * @private
 */
plugin.places.PlacesManager.prototype.onFileReady_ = function(file) {
  if (file) {
    var config = new plugin.file.kml.KMLLayerConfig();

    var options = this.getOptions();
    this.placesLayer_ = /** @type {!plugin.file.kml.KMLLayer} */ (config.createLayer(options));
    this.placesLayer_.setRemovable(false);
    this.placesLayer_.setSticky(true);

    // these are set for the sake of saving to a state file. we omit the UI's from options so they don't end up in the
    // saved state.
    this.placesLayer_.setLayerOptions(options);
    this.placesLayer_.setExplicitType('');
    this.placesLayer_.setLayerUI('');
    this.placesLayer_.setNodeUI('<placesnodeui></placesnodeui>');
    this.placesLayer_.renderLegend = goog.nullFunction;

    this.placesSource_ = /** @type {plugin.file.kml.KMLSource} */ (this.placesLayer_.getSource());
    ol.events.listen(this.placesSource_, goog.events.EventType.PROPERTYCHANGE, this.onSourcePropertyChange_, this);

    if (!this.placesSource_.isLoading()) {
      this.onSourceLoaded_();
    }
  } else if (!this.savedEmpty_) {
    this.savedEmpty_ = true;
    this.saveContent_(plugin.places.PlacesManager.EMPTY_CONTENT).addCallbacks(this.initialize, this.handleError_, this);
  } else {
    this.handleError_('Failed saving empty place content to storage.');
  }
};


/**
 * @return {Object<string, *>} the layer options
 * @protected
 */
plugin.places.PlacesManager.prototype.getOptions = function() {
  //
  // options used to create the places layer
  //
  // Notes:
  // * THIN-7476: animate will need to be updated/persisted when time is supported.
  // * THIN-7503: showLabels is set to false so labels won't be collision detected
  // * if a descriptor is created for this layer, we'll need to revisit the local data
  //   state logic to make sure the places URL doesn't get replaced on upload. this URL must always point to the IDB
  //   storage URL.
  //
  var options = {
    'animate': false,
    'color': os.style.DEFAULT_LAYER_COLOR,
    'collapsed': true,
    'columns': plugin.file.kml.SOURCE_FIELDS,
    'editable': true,
    'id': plugin.places.ID,
    'layerType': os.layer.LayerType.REF,
    'load': true,
    'provider': os.config.getAppName() || null,
    'showLabels': false,
    'showRoot': false,
    'title': plugin.places.TITLE,
    'type': 'kml',
    'url': plugin.places.PlacesManager.STORAGE_URL
  };

  // see if any layer options were persisted to settings
  var saved = /** @type {?Object} */ (os.settings.get(plugin.places.PlacesManager.LAYER_OPTIONS));
  if (saved) {
    os.object.merge(saved, options, true);
  }

  return options;
};


/**
 * Log an error.
 * @param {string} msg The error message
 * @param {Error=} opt_error The caught error
 * @private
 */
plugin.places.PlacesManager.prototype.handleError_ = function(msg, opt_error) {
  goog.log.error(this.log_, msg, opt_error);
};


/**
 * Clears all local places data from the application.
 * @private
 */
plugin.places.PlacesManager.prototype.clearPlaces_ = function() {
  this.removeLayer();

  // dispose of the layer, which will also dispose of the source/root node
  goog.dispose(this.placesLayer_);
  this.placesLayer_ = null;
  this.placesSource_ = null;
  this.placesRoot_ = null;
};


/**
 * Clears the storage key when application settings are reset.
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.PlacesManager.prototype.onSettingsReset_ = function(event) {
  // clear local data
  this.clearPlaces_();

  // clear stored data
  os.storage.incrementResetTasks();
  this.saveContent_(plugin.places.PlacesManager.EMPTY_CONTENT).addCallbacks(os.storage.decrementResetTasks,
      os.storage.decrementResetTasks);
};


/**
 * Save places to storage.
 * @param {!(ArrayBuffer|string)} content The file content
 * @return {!goog.async.Deferred} The deferred store request.
 * @private
 */
plugin.places.PlacesManager.prototype.saveContent_ = function(content) {
  var storage = os.file.FileStorage.getInstance();
  var file = os.file.createFromContent(plugin.places.TITLE, plugin.places.PlacesManager.STORAGE_URL, undefined,
      content);
  return storage.storeFile(file, true);
};


/**
 * Save data to storage.
 * @private
 */
plugin.places.PlacesManager.prototype.saveInternal_ = function() {
  if (this.placesRoot_) {
    // export the tree to a KMZ
    var exporter = plugin.places.createExporter(this.placesRoot_);
    exporter.setCompress(true);

    exporter.listenOnce(os.events.EventType.COMPLETE, this.onExportComplete_, false, this);
    exporter.listenOnce(os.events.EventType.ERROR, this.onExportError_, false, this);
    exporter.process();
  }

  if (this.placesLayer_) {
    os.settings.set(plugin.places.PlacesManager.LAYER_OPTIONS, this.placesLayer_.persist());
  }
};


/**
 * Success callback for importing data. Adds the areas to Area Manager
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.PlacesManager.prototype.onExportComplete_ = function(event) {
  // save it to storage
  var exporter = /** @type {plugin.file.kml.KMLTreeExporter} */ (event.target);
  var output = /** @type {ArrayBuffer|string} */ (exporter.getOutput() || '');
  exporter.dispose();

  if (output != null) {
    this.saveContent_(output);
  } else {
    this.handleError_('Failed exporting places to browser storage. Content was empty.');
  }
};


/**
 * Success callback for importing data. Adds the areas to Area Manager
 * @param {goog.events.Event} event
 * @private
 */
plugin.places.PlacesManager.prototype.onExportError_ = function(event) {
  var exporter = /** @type {plugin.file.kml.KMLTreeExporter} */ (event.target);
  exporter.dispose();

  this.handleError_('Failed exporting places to browser storage.');
};


/**
 * Initialize a KML node, making it editable and removable unless it's the root node.
 * @param {plugin.file.kml.ui.KMLNode} node The node
 * @private
 */
plugin.places.PlacesManager.prototype.initializeNode_ = function(node) {
  if (node) {
    node.canAddChildren = node.isFolder();

    if (node.getParent()) {
      node.editable = true;
      node.internalDrag = true;
      node.removable = true;
    }

    var children = node.getChildren();
    if (children) {
      for (var i = 0; i < children.length; i++) {
        this.initializeNode_(/** @type {plugin.file.kml.ui.KMLNode} */ (children[i]));
      }
    }
  }
};


/**
 * Handles source property change events.
 * @param {os.events.PropertyChangeEvent} event
 * @private
 */
plugin.places.PlacesManager.prototype.onSourcePropertyChange_ = function(event) {
  var p = event.getProperty();
  if (p === os.source.PropertyChange.LOADING) {
    if (!this.placesSource_.isLoading()) {
      this.onSourceLoaded_();
    }
  } else if (this.saveDelay_ && p && plugin.places.PlacesManager.SOURCE_SAVE_EVENTS.indexOf(p) !== -1) {
    this.saveDelay_.start();
  }
};


/**
 * Handle the source finishing loading.
 * @private
 */
plugin.places.PlacesManager.prototype.onSourceLoaded_ = function() {
  if (this.placesSource_) {
    // the root node is the kml node, so "Saved Places" is the first child.  Make that the root for places.
    this.placesRoot_ = /** @type {plugin.file.kml.ui.KMLNode} */ (this.placesSource_.getRootNode().getChildren()[0]);

    if (this.placesRoot_) {
      this.initializeNode_(this.placesRoot_);
      this.placesRoot_.collapsed = false;

      this.placesRoot_.listen(goog.events.EventType.PROPERTYCHANGE, this.onRootChange_, false, this);

      this.addLayer();
    }

    this.loaded_ = true;
    this.dispatchEvent(os.config.EventType.LOADED);
  }
};


/**
 * Handles changes on the root node
 * @param {os.events.PropertyChangeEvent} e The event
 * @private
 */
plugin.places.PlacesManager.prototype.onRootChange_ = function(e) {
  // save the tree when something changes
  if (this.saveDelay_) {
    this.saveDelay_.start();
  }
};
