goog.provide('plugin.cesium.sync.RootSynchronizer');

goog.require('goog.asserts');
goog.require('os.webgl.AbstractRootSynchronizer');


/**
 * The root synchronizer for the Cesium renderer.
 * @param {!ol.PluggableMap} map The OpenLayers map.
 * @param {!Cesium.Scene} scene The Cesium scene.
 * @extends {os.webgl.AbstractRootSynchronizer}
 * @constructor
 */
plugin.cesium.sync.RootSynchronizer = function(map, scene) {
  plugin.cesium.sync.RootSynchronizer.base(this, 'constructor', map);

  /**
   * The Cesium scene.
   * @type {Cesium.Scene|undefined}
   * @private
   */
  this.scene_ = scene;

  // Initialize ol-cesium library
  olcs.core.glAliasedLineWidthRange = this.scene_.maximumAliasedLineWidth;
};
goog.inherits(plugin.cesium.sync.RootSynchronizer, os.webgl.AbstractRootSynchronizer);


/**
 * @inheritDoc
 */
plugin.cesium.sync.RootSynchronizer.prototype.disposeInternal = function() {
  plugin.cesium.sync.RootSynchronizer.base(this, 'disposeInternal');
  this.scene_ = undefined;
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.RootSynchronizer.prototype.createSynchronizer = function(constructor, layer) {
  goog.asserts.assert(!!this.map);
  goog.asserts.assert(!!this.scene_);
  goog.asserts.assert(!!layer);

  return new constructor(layer, this.map, this.scene_);
};


/**
 * @inheritDoc
 */
plugin.cesium.sync.RootSynchronizer.prototype.updateGroupZ = function(group) {
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
      var synchronizer = this.synchronizers[layerId];
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

  var groups = this.map.getLayers().getArray();
  var idx = groups.indexOf(group);
  if (idx > 0) {
    // find the first group with layers and get its start index
    while (idx--) {
      var previousLayers = /** @type {os.layer.Group} */ (groups[idx]).getLayers().getArray();
      if (previousLayers.length > 0) {
        var layer = previousLayers[previousLayers.length - 1];
        if (layer instanceof os.layer.Image || layer instanceof os.layer.Tile) {
          var layerId = /** @type {os.layer.ILayer} */ (layer).getId();
          var synchronizer = this.synchronizers[layerId];
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

  var groups = this.map.getLayers().getArray();
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
