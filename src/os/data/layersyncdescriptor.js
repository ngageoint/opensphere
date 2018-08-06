goog.provide('os.data.LayerSyncDescriptor');

goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.events');
goog.require('os.IPersistable');
goog.require('os.command.LayerAdd');
goog.require('os.command.LayerRemove');
goog.require('os.data.BaseDescriptor');
goog.require('os.events.LayerEvent');
goog.require('os.events.LayerEventType');
goog.require('os.events.PropertyChangeEvent');
goog.require('os.layer.ILayer');
goog.require('os.layer.PropertyChange');
goog.require('os.ui.node.defaultLayerNodeUIDirective');



/**
 * A descriptor that synchronizes one or more layers on the map. This descriptor should be extended to implement the
 * getLayerOptions function, which should produce the options object(s) to be used in creating the layers sycnrhonized
 * to this descriptor.
 *
 * @extends {os.data.BaseDescriptor}
 * @constructor
 */
os.data.LayerSyncDescriptor = function() {
  os.data.LayerSyncDescriptor.base(this, 'constructor');
  this.log = os.data.LayerSyncDescriptor.LOGGER_;

  /**
   * @type {!Array<!os.layer.ILayer>}
   * @protected
   */
  this.layers = [];

  /**
   * @type {!Array<string>}
   * @protected
   */
  this.layerIds = [];

  /**
   * @type {!Object<string, *>}
   * @protected
   */
  this.layerConfig = {};

  os.dispatcher.listen(os.events.LayerEventType.ADD, this.onLayerAdded, false, this);
  os.dispatcher.listen(os.events.LayerEventType.REMOVE, this.onLayerRemoved, false, this);
};
goog.inherits(os.data.LayerSyncDescriptor, os.data.BaseDescriptor);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 */
os.data.LayerSyncDescriptor.LOGGER_ = goog.log.getLogger('os.data.LayerSyncDescriptor');


/**
 * Style change keys that descriptor needs to handle.
 * @type {Array<string>}
 * @const
 * @private
 */
os.data.LayerSyncDescriptor.STYLE_KEYS_ = ['opacity', 'contrast', 'brightness', 'saturation'];


/**
 * Keys that cause the descriptor to save.
 * @type {Array<string>}
 * @const
 * @private
 */
os.data.LayerSyncDescriptor.CHANGE_KEYS_ = ['minResolution', 'maxResolution'];


/**
 * @param {Object<string, *>} options
 * @return {string}
 */
os.data.LayerSyncDescriptor.mapLayerIds_ = function(options) {
  return /** @type {string} */ (options['id'] || '');
};

/**
 * @inheritDoc
 */
os.data.LayerSyncDescriptor.prototype.disposeInternal = function() {
  os.data.LayerSyncDescriptor.base(this, 'disposeInternal');
  os.dispatcher.unlisten(os.events.LayerEventType.ADD, this.onLayerAdded, false, this);
  os.dispatcher.unlisten(os.events.LayerEventType.REMOVE, this.onLayerRemoved, false, this);
  this.removeLayers_();
};


/**
 * Get the layers currently being synchronized by this descriptor.
 * @return {!Array<!os.layer.ILayer>} layers
 */
os.data.LayerSyncDescriptor.prototype.getLayers = function() {
  return this.layers;
};


/**
 * @param {Array<Object<string, *>>=} opt_options
 */
os.data.LayerSyncDescriptor.prototype.populateLayerIds = function(opt_options) {
  this.layerIds = (opt_options || this.getOptions()).map(os.data.LayerSyncDescriptor.mapLayerIds_);
};


/**
 * Get the options object(s) for each layer synchronized to this descriptor. Each options object will have the saved
 * layer config applied to it, then will be passed to {@link os.layer.createFromOptions} to create the layer prior to
 * adding it to the map.
 *
 * @return {(Array<!Object<string, *>>|Object<string, *>)} An options object that can be used to create a layer, or an
 *                                                         array of options objects.
 *
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.getLayerOptions = goog.abstractMethod;


/**
 * @return {?Array<!Object<string, *>>} An options object that can be used to create a layer
 */
os.data.LayerSyncDescriptor.prototype.getOptions = function() {
  var options = this.getLayerOptions();
  if (options) {
    if (!goog.isArray(options)) {
      options = [options];
    }

    return options.map(this.applyLayerConfig, this);
  }

  return options;
};


/**
 * If the layer is being synchronized by this descriptor.
 * @param {!os.layer.ILayer} layer The layer
 * @return {boolean}
 */
os.data.LayerSyncDescriptor.prototype.containsLayer = function(layer) {
  return this.layers.indexOf(layer) > -1;
};


/**
 * @inheritDoc
 */
os.data.LayerSyncDescriptor.prototype.setActiveInternal = function() {
  if (this.isActive()) {
    this.createLayers_();
  } else {
    this.removeLayers_();
  }

  // update the descriptor loading state
  this.onLoadingChange();

  return true;
};


/**
 * @param {!os.layer.ILayer} layer
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.addLayer = function(layer) {
  if (this.layers.indexOf(layer) === -1) {
    // listen for changes to the layer
    ol.events.listen(/** @type {ol.events.EventTarget} */ (layer), goog.events.EventType.PROPERTYCHANGE,
        this.onLayerChange, this);

    // add the layer to the map and the layer list
    this.layers.push(layer);
    this.setActive(true);
  }
};


/**
 * @param {!os.layer.ILayer} layer
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.removeLayer = function(layer) {
  if (this.layers.indexOf(layer) > -1) {
    // merge things on the layer that might have changed with the current layer options
    var config = this.persistLayerConfig();
    var keys = goog.object.getKeys(config);
    keys.forEach(function(key) {
      os.object.merge(/** @type {!Object} */(this.layerConfig[key]), /** @type {!Object} */(config[key]), true);
    }, this);

    ol.events.unlisten(/** @type {ol.events.EventTarget} */ (layer), goog.events.EventType.PROPERTYCHANGE,
        this.onLayerChange, this);

    goog.array.remove(this.layers, layer);
  }

  if (!this.layers.length) {
    this.setActive(false);
  }
};


/**
 * @param {!os.events.LayerEvent} evt
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.onLayerAdded = function(evt) {
  if (!goog.isString(evt.layer)) {
    var layer = /** @type {os.layer.ILayer} */ (evt.layer);

    if (!this.layerIds.length) {
      this.populateLayerIds();
    }

    if (this.layerIds.indexOf(layer.getId()) > -1) {
      this.addLayer(layer);
    }
  }
};


/**
 * @param {!os.events.LayerEvent} evt
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.onLayerRemoved = function(evt) {
  if (!goog.isString(evt.layer)) {
    var layer = /** @type {os.layer.ILayer} */ (evt.layer);

    if (!this.layerIds.length) {
      this.populateLayerIds();
    }

    if (this.layerIds.indexOf(layer.getId()) > -1 && this.layers.indexOf(layer) > -1) {
      this.removeLayer(layer);
    }
  }
};


/**
 * Create layers to be synchronized by this descriptor and add them to the map.
 * @private
 */
os.data.LayerSyncDescriptor.prototype.createLayers_ = function() {
  var options = this.getOptions();
  this.populateLayerIds(options);

  if (options) {
    for (var i = 0; i < options.length; i++) {
      var layerOptions = options[i];

      // create the layer if it doesn't already exist on the map
      var layerId = /** @type {string|undefined} */ (layerOptions['id']) || '';
      if (layerId) {
        var layer = os.MapContainer.getInstance().getLayer(layerId);
        if (!layer) {
          layer = os.layer.createFromOptions(layerOptions);

          if (layer) {
            os.MapContainer.getInstance().addLayer(layer);
          }
        } else {
          this.addLayer(/** @type {!os.layer.ILayer} */ (layer));
        }
      }
    }
  }
};


/**
 * Remove layers synchronized by this descriptor.
 * @private
 */
os.data.LayerSyncDescriptor.prototype.removeLayers_ = function() {
  // save the config prior to removing layers
  this.layerConfig = this.persistLayerConfig();

  for (var i = this.layers.length - 1; i >= 0; i--) {
    var layer = this.layers[i];
    if (layer) {
      // remove it from the map
      os.MapContainer.getInstance().removeLayer(layer);
    }
  }

  this.setLoading(false);
};


/**
 * Merge the layer configuration into the options used to create a layer.
 * @param {!Object<string, *>} options
 * @return {!Object<string, *>} The merged options
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.applyLayerConfig = function(options) {
  var opts = {};
  os.object.merge(options, opts, true);

  if (this.layerConfig) {
    var id = /** @type {string} */ (options['id']);
    if (id && id in this.layerConfig) {
      os.object.merge(/** @type {!Object} */ (this.layerConfig[id]), opts, true);
    }
  }

  return opts;
};


/**
 * @type {!Array<!string>}
 * @const
 */
os.data.LayerSyncDescriptor.STYLE_CHANGE_EVENTS = [
  os.layer.PropertyChange.STYLE,
  os.layer.PropertyChange.REFRESH_INTERVAL,
  os.layer.PropertyChange.TIME_ENABLED,
  'visible'];


/**
 * Handles layer property change
 * @param {(os.events.PropertyChangeEvent|ol.Object.Event)} e
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.onLayerChange = function(e) {
  // OL3 also fires 'propertychange' events, so separate handling of each
  if (e instanceof os.events.PropertyChangeEvent) {
    // handle our own change event
    var p = e.getProperty() || '';
    if (p == 'loading') {
      this.onLoadingChange(e);
    } else if (os.data.LayerSyncDescriptor.STYLE_CHANGE_EVENTS.indexOf(p) > -1) {
      this.onStyleChange();
    } else {
      this.saveDescriptor();
    }
  } else if (e instanceof ol.Object.Event) {
    // handle the OL3 change event
    if (os.data.LayerSyncDescriptor.STYLE_KEYS_.indexOf(e.key) > -1) {
      this.onStyleChange();
    } else if (os.data.LayerSyncDescriptor.CHANGE_KEYS_.indexOf(e.key) > -1) {
      this.saveDescriptor();
    }
  }
};


/**
 * Handle changes to the loading state on a synchronized layer.
 * @param {os.events.PropertyChangeEvent=} opt_event
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.onLoadingChange = function(opt_event) {
  var layers = this.getLayers();
  if (layers) {
    for (var i = 0, n = layers.length; i < n; i++) {
      if (layers[i].isLoading()) {
        this.setLoading(true);
        return;
      }
    }
  }

  this.setLoading(false);
};


/**
 * Handles layer style change.
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.onStyleChange = function() {
  // update the layer config when styles change
  this.saveDescriptor();
};


/**
 * Save the descriptor to storage.
 * @protected
 */
os.data.LayerSyncDescriptor.prototype.saveDescriptor = function() {
  this.layerConfig = this.persistLayerConfig();
  os.dataManager.persistDescriptors();
};


/**
 * @inheritDoc
 */
os.data.LayerSyncDescriptor.prototype.persist = function(opt_obj) {
  if (!opt_obj) {
    opt_obj = {};
  }

  opt_obj['layer'] = this.persistLayerConfig();
  return os.data.LayerSyncDescriptor.base(this, 'persist', opt_obj);
};


/**
 * @inheritDoc
 */
os.data.LayerSyncDescriptor.prototype.restore = function(conf) {
  this.layerConfig = conf['layer'] || {};
  os.data.LayerSyncDescriptor.base(this, 'restore', conf);
};


/**
 * Persist each synchronized layer to an object keyed by layer id.
 * @return {!Object<string, *>} config
 */
os.data.LayerSyncDescriptor.prototype.persistLayerConfig = function() {
  var config = {};

  var layers = this.getLayers();
  for (var i = 0, n = layers.length; i < n; i++) {
    config[layers[i].getId()] = layers[i].persist();
  }

  return config;
};


/**
 * @inheritDoc
 */
os.data.LayerSyncDescriptor.prototype.getNodeUI = function() {
  return '<defaultlayernodeui></defaultlayernodeui>';
};
