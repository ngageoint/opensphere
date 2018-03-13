goog.provide('os.olcs.sync.RootSynchronizer');

goog.require('goog.Disposable');
goog.require('goog.asserts');
goog.require('goog.async.Delay');
goog.require('ol.events');
goog.require('os.MapEvent');
goog.require('os.data.ZOrderEventType');
goog.require('os.layer.Group');
goog.require('os.layer.Image');
goog.require('os.layer.Tile');
goog.require('os.olcs.sync.SynchronizerManager');



/**
 * @param {!ol.Map} map
 * @param {!Cesium.Scene} scene
 * @extends {goog.Disposable}
 * @constructor
 */
os.olcs.sync.RootSynchronizer = function(map, scene) {
  /**
   * @type {boolean}
   * @protected
   */
  this.active = false;

  /**
   * @type {boolean}
   * @private
   */
  this.initialized_ = false;

  /**
   * @type {!Array<ol.EventsKey>}
   * @private
   */
  this.listenKeys_ = [];

  /**
   * @type {ol.Map}
   * @private
   */
  this.map_ = map;

  /**
   * @type {Cesium.Scene}
   * @private
   */
  this.scene_ = scene;

  /**
   * @type {Object.<string, os.olcs.sync.AbstractSynchronizer>}
   * @private
   */
  this.synchronizers_ = {};

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.updateZDelay_ = new goog.async.Delay(this.updateZOrder_, 250, this);

  // Initialize os library
  olcs.core.glAliasedLineWidthRange = this.scene_.maximumAliasedLineWidth;
};
goog.inherits(os.olcs.sync.RootSynchronizer, goog.Disposable);


/**
 * @inheritDoc
 */
os.olcs.sync.RootSynchronizer.prototype.disposeInternal = function() {
  this.listenKeys_.forEach(ol.events.unlistenByKey);
  this.listenKeys_.length = 0;

  goog.dispose(this.updateZDelay_);
  this.updateZDelay_ = null;

  this.scene_ = null;
  this.map_ = null;

  os.olcs.sync.RootSynchronizer.base(this, 'disposeInternal');
};


/**
 * Synchronizes all layers on the map.
 */
os.olcs.sync.RootSynchronizer.prototype.synchronize = function() {
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
os.olcs.sync.RootSynchronizer.prototype.reset = function() {
  for (var key in this.synchronizers_) {
    this.synchronizers_[key].reset();
  }
};


/**
 * Set if the synchronizer should be actively used.
 * @param {boolean} value
 */
os.olcs.sync.RootSynchronizer.prototype.setActive = function(value) {
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
os.olcs.sync.RootSynchronizer.prototype.synchronizeGroup_ = function(group) {
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
os.olcs.sync.RootSynchronizer.prototype.synchronizeLayer_ = function(layer) {
  goog.asserts.assert(!goog.isNull(this.map_));
  goog.asserts.assert(!goog.isNull(this.scene_));
  goog.asserts.assert(layer);

  var osLayer = /** @type {os.layer.ILayer} */ (layer);
  var layerId = osLayer.getId();
  if (layerId) {
    var synchronizer = this.synchronizers_[layerId];

    if (!synchronizer) {
      var sm = os.olcs.sync.SynchronizerManager.getInstance();
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
os.olcs.sync.RootSynchronizer.prototype.onGroupZOrder_ = function(event) {
  var group = event.target;
  if (group instanceof os.layer.Group) {
    this.updateGroupZ_(group);
  }
};


/**
 * Update the z-order of all groups.
 * @private
 */
os.olcs.sync.RootSynchronizer.prototype.updateZOrder_ = function() {
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
os.olcs.sync.RootSynchronizer.prototype.updateGroupZ_ = function(group) {
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
os.olcs.sync.RootSynchronizer.prototype.getGroupStartIndex_ = function(group) {
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
os.olcs.sync.RootSynchronizer.prototype.getVectorGroupStartIndex_ = function(group) {
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
os.olcs.sync.RootSynchronizer.prototype.onLayerAdd_ = function(event) {
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
os.olcs.sync.RootSynchronizer.prototype.onLayerRemove_ = function(event) {
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
os.olcs.sync.RootSynchronizer.prototype.updateFromCamera = function() {
  for (var key in this.synchronizers_) {
    var synchronizer = this.synchronizers_[key];
    synchronizer.updateFromCamera();
  }
};
