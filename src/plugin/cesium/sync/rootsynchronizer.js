goog.provide('plugin.cesium.sync.RootSynchronizer');

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
 * The root synchronizer for the Cesium renderer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {goog.Disposable}
 * @constructor
 */
plugin.cesium.sync.RootSynchronizer = function(map, scene) {
  plugin.cesium.sync.RootSynchronizer.base(this, 'constructor');

  /**
   * If the synchronizer is active.
   * @type {boolean}
   * @protected
   */
  this.active = false;

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
   * The OpenLayers map.
   * @type {ol.PluggableMap|undefined}
   * @private
   */
  this.map_ = map;

  /**
   * The Cesium scene.
   * @type {Cesium.Scene|undefined}
   * @private
   */
  this.scene_ = scene;

  /**
   * Map of layer id to Cesium synchronizer.
   * @type {!Object<string, !os.webgl.AbstractWebGLSynchronizer>}
   * @private
   */
  this.synchronizers_ = {};

  /**
   * Delay to debounce z order updates.
   * @type {goog.async.Delay|undefined}
   * @private
   */
  this.updateZDelay_ = new goog.async.Delay(this.updateZOrder_, 250, this);

  // Initialize ol-cesium library
  olcs.core.glAliasedLineWidthRange = this.scene_.maximumAliasedLineWidth;
};
goog.inherits(plugin.cesium.sync.RootSynchronizer, goog.Disposable);


/**
 * @inheritDoc
 */
plugin.cesium.sync.RootSynchronizer.prototype.disposeInternal = function() {
  this.listenKeys_.forEach(ol.events.unlistenByKey);
  this.listenKeys_.length = 0;

  goog.dispose(this.updateZDelay_);
  this.updateZDelay_ = undefined;

  this.scene_ = undefined;
  this.map_ = undefined;

  plugin.cesium.sync.RootSynchronizer.base(this, 'disposeInternal');
};


/**
 * Synchronizes all layers on the map.
 */
plugin.cesium.sync.RootSynchronizer.prototype.synchronize = function() {
  if (this.initialized_) {
    return;
  }

  var groups = this.map_.getLayers().getArray();
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
plugin.cesium.sync.RootSynchronizer.prototype.reset = function() {
  for (var key in this.synchronizers_) {
    this.synchronizers_[key].reset();
  }
};


/**
 * Set if the synchronizer should be actively used.
 * @param {boolean} value
 */
plugin.cesium.sync.RootSynchronizer.prototype.setActive = function(value) {
  this.active = value;

  for (var key in this.synchronizers_) {
    this.synchronizers_[key].setActive(value);
  }
};


/**
 * Synchronizes a single layer on the map to Cesium.
 * @param {!os.layer.Group} group
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.synchronizeGroup_ = function(group) {
  var layers = group.getLayers().getArray();
  for (var i = 0, n = layers.length; i < n; i++) {
    var layer = layers[i];
    if (layer instanceof ol.layer.Layer) {
      this.synchronizeLayer_(layer);
    }
  }
};


/**
 * Synchronizes a single layer on the map to Cesium.
 * @param {!ol.layer.Layer} layer
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.synchronizeLayer_ = function(layer) {
  goog.asserts.assert(!goog.isNull(this.map_));
  goog.asserts.assert(!goog.isNull(this.scene_));
  goog.asserts.assert(layer);

  var osLayer = /** @type {os.layer.ILayer} */ (layer);
  var layerId = osLayer.getId();
  if (layerId) {
    var synchronizer = this.synchronizers_[layerId];

    if (!synchronizer) {
      var sm = os.webgl.SynchronizerManager.getInstance();
      var constructor = sm.getSynchronizer(osLayer);
      if (constructor) {
        synchronizer = new constructor(layer, this.map_, this.scene_);
      }
    }

    if (synchronizer) {
      this.synchronizers_[layerId] = synchronizer;
      synchronizer.setActive(this.active);
      synchronizer.synchronize();
      os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
    }
  }
};


/**
 * Handle changes to a group's z-order.
 * @param {goog.events.Event} event
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.onGroupZOrder_ = function(event) {
  var group = event.target;
  if (group instanceof os.layer.Group) {
    this.updateGroupZ_(group);
  }
};


/**
 * Update the z-order of all groups.
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.updateZOrder_ = function() {
  var groups = this.map_.getLayers().getArray();
  for (var i = 0, n = groups.length; i < n; i++) {
    var group = groups[i];
    if (group instanceof os.layer.Group) {
      this.updateGroupZ_(group);
    }
  }
};


/**
 * Update the z-order of a group.
 * @param {!os.layer.Group} group The group to update.
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.updateGroupZ_ = function(group) {
  var layers = group.getLayers().getArray();
  if (layers.length > 0) {
    var layerCount = 0;
    var startIndex = 0;

    if (layers[0] instanceof os.layer.Tile) {
      layerCount = os.MapContainer.getInstance().getLayerCount(os.layer.Tile);
      startIndex = this.getGroupStartIndex_(group);
    } else if (layers[0] instanceof os.layer.Vector) {
      layerCount = os.MapContainer.getInstance().getLayerCount(os.layer.Vector);

      // higher z-index is displayed on top, lowest z-index should be 1. determine the layer index by:
      // total vector layers - start of current group - layers in current group + 1
      startIndex = layerCount - this.getVectorGroupStartIndex_(group) - layers.length + 1;
    } else if (layers[0] instanceof os.layer.Image) {
      layerCount = os.MapContainer.getInstance().getLayerCount(os.layer.Image);
      startIndex = this.getGroupStartIndex_(group);
    }

    for (var i = 0, n = layers.length; i < n; i++) {
      var layerId = /** @type {os.layer.ILayer} */ (layers[i]).getId();
      var synchronizer = this.synchronizers_[layerId];
      if (synchronizer) {
        startIndex = synchronizer.reposition(startIndex, layerCount);
      }
    }

    os.dispatcher.dispatchEvent(os.MapEvent.GL_REPAINT);
  }
};


/**
 * Gets the start index of the provided tile or image group by looking up the last index of the previous group,
 * or 0 if passed the first group on the map.
 * @param {!os.layer.Group} group The group to look up
 * @return {number} The first index in the layers array
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.getGroupStartIndex_ = function(group) {
  var startIndex = 0;

  var groups = this.map_.getLayers().getArray();
  var idx = groups.indexOf(group);
  if (idx > 0) {
    // find the first group with layers and get its start index
    while (idx--) {
      var previousLayers = /** @type {os.layer.Group} */ (groups[idx]).getLayers().getArray();
      if (previousLayers.length > 0) {
        var layer = previousLayers[previousLayers.length - 1];
        if (layer instanceof os.layer.Image || layer instanceof os.layer.Tile) {
          var layerId = /** @type {os.layer.ILayer} */ (layer).getId();
          var synchronizer = this.synchronizers_[layerId];
          if (synchronizer) {
            startIndex = synchronizer.getLastIndex() + 1;
            break;
          }
        }
      }
    }
  }

  return startIndex;
};


/**
 * Gets the start index of the provided vector group by counting the number of previous vector layers.
 * @param {!os.layer.Group} group The group to look up
 * @return {number} The first index in the layers array
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.getVectorGroupStartIndex_ = function(group) {
  var startIndex = 0;

  var groups = this.map_.getLayers().getArray();
  var i = groups.length;
  while (i--) {
    if (groups[i] == group) {
      break;
    }

    var previousLayers = /** @type {os.layer.Group} */ (groups[i]).getLayers().getArray();
    if (previousLayers.length > 0 && previousLayers[previousLayers.length - 1] instanceof os.layer.Vector) {
      startIndex += previousLayers.length;
    }
  }

  return startIndex;
};


/**
 * Handles a layer being added to a group, synchronizing the group to ensure proper z-index.
 * @param {os.events.LayerEvent} event
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.onLayerAdd_ = function(event) {
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
 * Handles a layer being removed from a group, destroying its Cesium counterpart.
 * @param {os.events.LayerEvent} event
 * @private
 */
plugin.cesium.sync.RootSynchronizer.prototype.onLayerRemove_ = function(event) {
  if (event && event.layer) {
    var layer = goog.isString(event.layer) ?
        /** @type {os.layer.ILayer} */ (os.MapContainer.getInstance().getLayer(event.layer)) :
        /** @type {os.layer.ILayer} */ (event.layer);

    if (layer) {
      var id = layer.getId();
      if (this.synchronizers_[id]) {
        this.synchronizers_[id].dispose();
        delete this.synchronizers_[id];

        if (this.updateZDelay_) {
          this.updateZDelay_.start();
        }
      }
    }
  }
};


/**
 * Update any Cesium primitives that must change based on camera movement.
 */
plugin.cesium.sync.RootSynchronizer.prototype.updateFromCamera = function() {
  for (var key in this.synchronizers_) {
    var synchronizer = this.synchronizers_[key];
    synchronizer.updateFromCamera();
  }
};
