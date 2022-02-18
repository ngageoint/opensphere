goog.declareModuleId('plugin.cesium.sync.RootSynchronizer');

import * as dispatcher from '../../../os/dispatcher.js';
import Image from '../../../os/layer/image.js';
import Tile from '../../../os/layer/tile.js';
import Vector from '../../../os/layer/vector.js';
import VectorTile from '../../../os/layer/vectortile.js';
import MapEvent from '../../../os/map/mapevent.js';
import MapContainer from '../../../os/mapcontainer.js';
import AbstractRootSynchronizer from '../../../os/webgl/abstractrootsynchronizer.js';
import TileSynchronizer from './tilesynchronizer.js';

const asserts = goog.require('goog.asserts');


/**
 * The root synchronizer for the Cesium renderer.
 */
export default class RootSynchronizer extends AbstractRootSynchronizer {
  /**
   * Constructor.
   * @param {!PluggableMap} map The OpenLayers map.
   * @param {!Cesium.Scene} scene The Cesium scene.
   */
  constructor(map, scene) {
    super(map);

    /**
     * The Cesium scene.
     * @type {Cesium.Scene|undefined}
     * @private
     */
    this.scene_ = scene;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();
    this.scene_ = undefined;
  }

  /**
   * @inheritDoc
   */
  createSynchronizer(constructor, layer) {
    asserts.assert(!!this.map);
    asserts.assert(!!this.scene_);
    asserts.assert(!!layer);

    return /** @type {!AbstractWebGLSynchronizer} */ (new
    /** @type {function(new: Object, OLLayer, PluggableMap, (Cesium.Scene|undefined))} */ (
      constructor)(layer, this.map, this.scene_));
  }

  /**
   * @inheritDoc
   */
  updateGroupZ(group) {
    var layers = group.getLayers().getArray();
    if (layers.length > 0) {
      var layerCount = 0;
      var startIndex = 0;

      if (layers[0] instanceof Tile) {
        layerCount = MapContainer.getInstance().getLayerCount(Tile);
        startIndex = this.getGroupStartIndex_(group);
      } else if (layers[0] instanceof Vector) {
        layerCount = MapContainer.getInstance().getLayerCount(Vector);

        // higher z-index is displayed on top, lowest z-index should be 1. determine the layer index by:
        // total vector layers - start of current group - layers in current group + 1
        startIndex = layerCount - this.getVectorGroupStartIndex_(group) - layers.length + 1;
      } else if (layers[0] instanceof Image) {
        layerCount = MapContainer.getInstance().getLayerCount(Image);
        startIndex = this.getGroupStartIndex_(group);
      } else if (layers[0] instanceof VectorTile) {
        layerCount = MapContainer.getInstance().getLayerCount(VectorTile);
        startIndex = this.getGroupStartIndex_(group);
      }

      for (var i = 0, n = layers.length; i < n; i++) {
        var layerId = /** @type {ILayer} */ (layers[i]).getId();
        var synchronizer = this.synchronizers[layerId];
        if (synchronizer) {
          startIndex = synchronizer.reposition(startIndex, layerCount);
        }
      }

      dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
    }
  }

  /**
   * Gets the start index of the provided tile or image group by looking up the last index of the previous group,
   * or 0 if passed the first group on the map.
   *
   * @param {!Group} group The group to look up
   * @return {number} The first index in the layers array
   * @private
   */
  getGroupStartIndex_(group) {
    var startIndex = 0;

    var groups = this.map.getLayers().getArray();
    var idx = groups.indexOf(group);
    if (idx > 0) {
      // find the first group with layers and get its start index
      while (idx--) {
        var previousLayers = /** @type {Group} */ (groups[idx]).getLayers().getArray();
        if (previousLayers.length > 0) {
          var layer = previousLayers[previousLayers.length - 1];
          if (layer instanceof Image || layer instanceof Tile ||
              layer instanceof VectorTile) {
            var layerId = /** @type {ILayer} */ (layer).getId();
            var synchronizer = this.synchronizers[layerId];
            if (synchronizer instanceof TileSynchronizer) {
              startIndex = synchronizer.getLastIndex() + 1;
              break;
            }
          }
        }
      }
    }

    return startIndex;
  }

  /**
   * Gets the start index of the provided vector group by counting the number of previous vector layers.
   *
   * @param {!Group} group The group to look up
   * @return {number} The first index in the layers array
   * @private
   */
  getVectorGroupStartIndex_(group) {
    var startIndex = 0;

    var groups = this.map.getLayers().getArray();
    var i = groups.length;
    while (i--) {
      if (groups[i] == group) {
        break;
      }

      var previousLayers = /** @type {Group} */ (groups[i]).getLayers().getArray();
      if (previousLayers.length > 0 && previousLayers[previousLayers.length - 1] instanceof Vector) {
        startIndex += previousLayers.length;
      }
    }

    return startIndex;
  }
}
