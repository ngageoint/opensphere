goog.provide('os.webgl.AbstractRootSynchronizer');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('ol.events');
goog.require('os.MapEvent');
goog.require('os.data.ZOrderEventType');
goog.require('os.layer.Group');
goog.require('os.layer.Image');
goog.require('os.layer.Tile');
goog.require('os.webgl.SynchronizerManager');


/**
 * An abstract root synchronizer for a WebGL renderer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @extends {goog.Disposable}
 * @constructor
 */
os.webgl.AbstractRootSynchronizer = function(map) {
  os.webgl.AbstractRootSynchronizer.base(this, 'constructor');

  /**
   * The OpenLayers map.
   * @type {ol.PluggableMap|undefined}
   * @protected
   */
  this.map = map;

  /**
   * If the synchronizer is active.
   * @type {boolean}
   * @private
   */
  this.active_ = false;

  /**
   * If the synchronizer is initialized.
   * @type {boolean}
   * @private
   */
  this.initialized_ = false;

  /**
   * OpenLayers layer listen keys.
   * @type {!Array<ol.EventsKey>}
   * @private
   */
  this.listenKeys_ = [];

  /**
   * Map of layer id to WebGL synchronizer.
   * @type {!Object<string, !os.webgl.AbstractWebGLSynchronizer>}
   * @protected
   */
  this.synchronizers = {};

  /**
   * Delay to debounce z order updates.
   * @type {goog.async.Delay|undefined}
   * @private
   */
  this.updateZDelay_ = new goog.async.Delay(this.updateZOrder_, 250, this);
};
goog.inherits(os.webgl.AbstractRootSynchronizer, goog.Disposable);


/**
 * @inheritDoc
 */
os.webgl.AbstractRootSynchronizer.prototype.disposeInternal = function() {
  os.webgl.AbstractRootSynchronizer.base(this, 'disposeInternal');

  this.listenKeys_.forEach(ol.events.unlistenByKey);
  this.listenKeys_.length = 0;

  goog.dispose(this.updateZDelay_);
  this.updateZDelay_ = undefined;

  this.map = undefined;
};


/**
 * Synchronizes all layers on the map.
 */
os.webgl.AbstractRootSynchronizer.prototype.synchronize = function() {
  if (this.initialized_) {
    return;
  }

  var groups = this.map.getLayers().getArray();
  for (var i = 0, n = groups.length; i < n; i++) {
    var group = groups[i];
    if (group instanceof os.layer.Group) {
      this.listenKeys_.push(ol.events.listen(group, os.data.ZOrderEventType.UPDATE, this.onGroupZOrder_, this));
      this.listenKeys_.push(ol.events.listen(group, os.events.LayerEventType.ADD, this.onLayerAdd_, this));
      this.listenKeys_.push(ol.events.listen(group, os.events.LayerEventType.REMOVE, this.onLayerRemove_, this));

      this.synchronizeGroup_(group);
    }
  }

  this.initialized_ = true;
};


/**
 * Reset synchronizers to make sure the state is in sync with 2D.
 */
os.webgl.AbstractRootSynchronizer.prototype.reset = function() {
  for (var key in this.synchronizers) {
    this.synchronizers[key].reset();
  }
};


/**
 * Set if the synchronizer should be actively used.
 * @param {boolean} value
 */
os.webgl.AbstractRootSynchronizer.prototype.setActive = function(value) {
  this.active_ = value;

  for (var key in this.synchronizers) {
    this.synchronizers[key].setActive(value);
  }
};


/**
 * Synchronizes a single layer on the map to WebGL.
 * @param {!os.layer.Group} group
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.synchronizeGroup_ = function(group) {
  var layers = group.getLayers().getArray();
  for (var i = 0, n = layers.length; i < n; i++) {
    var layer = layers[i];
    if (layer instanceof ol.layer.Layer) {
      this.synchronizeLayer_(layer);
    }
  }
};


/**
 * Synchronizes a single layer on the map to WebGL.
 * @param {!ol.layer.Layer} layer
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.synchronizeLayer_ = function(layer) {
  goog.asserts.assert(!!this.map);
  goog.asserts.assert(!!layer);

  var osLayer = /** @type {os.layer.ILayer} */ (layer);
  var layerId = osLayer.getId();
  if (layerId) {
    var synchronizer = this.synchronizers[layerId];

    if (!synchronizer) {
      var sm = os.webgl.SynchronizerManager.getInstance();
      var constructor = sm.getSynchronizer(osLayer);
      if (constructor) {
        synchronizer = this.createSynchronizer(constructor, layer);
      }
    }

    if (synchronizer) {
      this.synchronizers[layerId] = synchronizer;
      synchronizer.setActive(this.active_);
      synchronizer.synchronize();
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};


/**
 * Create an instance of a synchronizer.
 * @param {function(new:os.webgl.AbstractWebGLSynchronizer, ...?)} constructor The synchronizer constructor.
 * @param {!ol.layer.Layer} layer The layer to synchronize.
 * @return {!os.webgl.AbstractWebGLSynchronizer} The synchronizer instance.
 */
os.webgl.AbstractRootSynchronizer.prototype.createSynchronizer = function(constructor, layer) {
  goog.asserts.assert(!!this.map);

  return new constructor(layer, this.map);
};


/**
 * Handle changes to a group's z-order.
 * @param {goog.events.Event} event
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.onGroupZOrder_ = function(event) {
  var group = event.target;
  if (group instanceof os.layer.Group) {
    this.updateGroupZ(group);
  }
};


/**
 * Update the z-order of all groups.
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.updateZOrder_ = function() {
  var groups = this.map.getLayers().getArray();
  for (var i = 0, n = groups.length; i < n; i++) {
    var group = groups[i];
    if (group instanceof os.layer.Group) {
      this.updateGroupZ(group);
    }
  }
};


/**
 * Update the z-order of a group.
 * @param {!os.layer.Group} group The group to update.
 * @protected
 */
os.webgl.AbstractRootSynchronizer.prototype.updateGroupZ = function(group) {
  // implement in extending classes to support layer z-indexing
};


/**
 * Handles a layer being added to a group, synchronizing the group to ensure proper z-index.
 * @param {os.events.LayerEvent} event
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.onLayerAdd_ = function(event) {
  if (event && event.layer) {
    var layer = goog.isString(event.layer) ?
        /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(event.layer)) :
        /** @type {os.layer.ILayer} */ (event.layer);

    if (layer instanceof ol.layer.Layer) {
      this.synchronizeLayer_(layer);

      if (this.updateZDelay_) {
        this.updateZDelay_.start();
      }
    }
  }
};


/**
 * Handles a layer being removed from a group, destroying its WebGL counterpart.
 * @param {os.events.LayerEvent} event
 * @private
 */
os.webgl.AbstractRootSynchronizer.prototype.onLayerRemove_ = function(event) {
  if (event && event.layer) {
    var layer = goog.isString(event.layer) ?
        /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(event.layer)) :
        /** @type {os.layer.ILayer} */ (event.layer);

    if (layer) {
      var id = layer.getId();
      if (this.synchronizers[id]) {
        this.synchronizers[id].dispose();
        delete this.synchronizers[id];

        if (this.updateZDelay_) {
          this.updateZDelay_.start();
        }
      }
    }
  }
};


/**
 * Update any synchronizers that must change based on camera movement.
 */
os.webgl.AbstractRootSynchronizer.prototype.updateFromCamera = function() {
  for (var key in this.synchronizers) {
    var synchronizer = this.synchronizers[key];
    synchronizer.updateFromCamera();
  }
};
