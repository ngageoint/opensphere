goog.declareModuleId('os.webgl.AbstractRootSynchronizer');

import {listen, unlistenByKey} from 'ol/src/events.js';
import Layer from 'ol/src/layer/Layer.js';
import ZOrderEventType from '../data/zordereventtype.js';
import * as dispatcher from '../dispatcher.js';
import LayerEventType from '../events/layereventtype.js';
import Group from '../layer/group.js';
import MapEvent from '../map/mapevent.js';
import {getMapContainer} from '../map/mapinstance.js';
import SynchronizerManager from './synchronizermanager.js';

const Disposable = goog.require('goog.Disposable');
const asserts = goog.require('goog.asserts');
const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');

const {default: LayerEvent} = goog.requireType('os.events.LayerEvent');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: AbstractWebGLSynchronizer} = goog.requireType('os.webgl.AbstractWebGLSynchronizer');


/**
 * An abstract root synchronizer for a WebGL renderer.
 */
export default class AbstractRootSynchronizer extends Disposable {
  /**
   * Constructor.
   * @param {!ol.PluggableMap} map The OpenLayers map.
   */
  constructor(map) {
    super();

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
     * @type {!Object<string, !AbstractWebGLSynchronizer>}
     * @protected
     */
    this.synchronizers = {};

    /**
     * Delay to debounce z order updates.
     * @type {Delay|undefined}
     * @private
     */
    this.updateZDelay_ = new Delay(this.updateZOrder_, 250, this);
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    super.disposeInternal();

    this.listenKeys_.forEach(unlistenByKey);
    this.listenKeys_.length = 0;

    dispose(this.updateZDelay_);
    this.updateZDelay_ = undefined;

    this.map = undefined;
  }

  /**
   * Synchronizes all layers on the map.
   */
  synchronize() {
    if (this.initialized_) {
      return;
    }

    var groups = this.map.getLayers().getArray();
    for (var i = 0, n = groups.length; i < n; i++) {
      var group = groups[i];
      if (group instanceof Group) {
        this.listenKeys_.push(listen(group, ZOrderEventType.UPDATE, this.onGroupZOrder_, this));
        this.listenKeys_.push(listen(group, LayerEventType.ADD, this.onLayerAdd_, this));
        this.listenKeys_.push(listen(group, LayerEventType.REMOVE, this.onLayerRemove_, this));

        this.synchronizeGroup_(group);
      }
    }

    this.initialized_ = true;
  }

  /**
   * Reset synchronizers to make sure the state is in sync with 2D.
   */
  reset() {
    for (var key in this.synchronizers) {
      this.synchronizers[key].reset();
    }
  }

  /**
   * Set if the synchronizer should be actively used.
   *
   * @param {boolean} value
   */
  setActive(value) {
    this.active_ = value;

    for (var key in this.synchronizers) {
      this.synchronizers[key].setActive(value);
    }
  }

  /**
   * Synchronizes a single layer on the map to WebGL.
   *
   * @param {!Group} group
   * @private
   */
  synchronizeGroup_(group) {
    var layers = group.getLayers().getArray();
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = layers[i];
      if (layer instanceof Layer) {
        this.synchronizeLayer_(layer);
      }
    }
  }

  /**
   * Synchronizes a single layer on the map to WebGL.
   *
   * @param {!ol.layer.Layer} layer
   * @private
   */
  synchronizeLayer_(layer) {
    asserts.assert(!!this.map);
    asserts.assert(!!layer);

    var osLayer = /** @type {ILayer} */ (layer);
    var layerId = osLayer.getId();
    if (layerId) {
      var synchronizer = this.synchronizers[layerId];

      if (!synchronizer) {
        var sm = SynchronizerManager.getInstance();
        var constructor = sm.getSynchronizer(osLayer);
        if (constructor) {
          synchronizer = this.createSynchronizer(constructor, layer);
        }
      }

      if (synchronizer) {
        this.synchronizers[layerId] = synchronizer;
        synchronizer.setActive(this.active_);
        synchronizer.synchronize();
        dispatcher.getInstance().dispatchEvent(MapEvent.GL_REPAINT);
      }
    }
  }

  /**
   * Create an instance of a synchronizer.
   *
   * @param {function(new:AbstractWebGLSynchronizer, ...?)} constructor The synchronizer constructor.
   * @param {!ol.layer.Layer} layer The layer to synchronize.
   * @return {!AbstractWebGLSynchronizer} The synchronizer instance.
   */
  createSynchronizer(constructor, layer) {
    asserts.assert(!!this.map);

    return /** @type {!AbstractWebGLSynchronizer} */ (new
    /** @type {function(new: Object, ol.layer.Layer, ol.PluggableMap)} */ (constructor)(layer, this.map));
  }

  /**
   * Handle changes to a group's z-order.
   *
   * @param {goog.events.Event} event
   * @private
   */
  onGroupZOrder_(event) {
    var group = event.target;
    if (group instanceof Group) {
      this.updateGroupZ(group);
    }
  }

  /**
   * Update the z-order of all groups.
   *
   * @private
   */
  updateZOrder_() {
    var groups = this.map.getLayers().getArray();
    for (var i = 0, n = groups.length; i < n; i++) {
      var group = groups[i];
      if (group instanceof Group) {
        this.updateGroupZ(group);
      }
    }
  }

  /**
   * Update the z-order of a group.
   *
   * @param {!Group} group The group to update.
   * @protected
   */
  updateGroupZ(group) {
    // implement in extending classes to support layer z-indexing
  }

  /**
   * Handles a layer being added to a group, synchronizing the group to ensure proper z-index.
   *
   * @param {LayerEvent} event
   * @private
   */
  onLayerAdd_(event) {
    if (event && event.layer) {
      var layer = /** @type {ILayer} */ (typeof event.layer === 'string' ?
          getMapContainer().getLayer(event.layer) : event.layer);

      if (layer instanceof Layer) {
        this.synchronizeLayer_(layer);

        if (this.updateZDelay_) {
          this.updateZDelay_.start();
        }
      }
    }
  }

  /**
   * Handles a layer being removed from a group, destroying its WebGL counterpart.
   *
   * @param {LayerEvent} event
   * @private
   */
  onLayerRemove_(event) {
    if (event && event.layer) {
      var layer = /** @type {ILayer} */ (typeof event.layer === 'string' ?
          getMapContainer().getLayer(event.layer) : event.layer);

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
  }

  /**
   * Update any synchronizers that must change based on camera movement.
   */
  updateFromCamera() {
    for (var key in this.synchronizers) {
      var synchronizer = this.synchronizers[key];
      synchronizer.updateFromCamera();
    }
  }
}
