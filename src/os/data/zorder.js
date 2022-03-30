goog.declareModuleId('os.data.ZOrder');

import * as olArray from 'ol/src/array.js';

import Settings from '../config/settings.js';
import {getMapContainer} from '../map/mapinstance.js';
import ZOrderEventType from './zordereventtype.js';

const EventTarget = goog.require('goog.events.EventTarget');

const {default: ZOrderEntry} = goog.requireType('os.data.ZOrderEntry');
const {default: LayerGroup} = goog.requireType('os.layer.Group');
const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: VectorLayer} = goog.requireType('os.layer.Vector');


/**
 * Maintains Z-Order for layers between sessions
 */
export default class ZOrder extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {?ol.Map}
     * @private
     */
    this.map_ = null;

    /**
     * @type {?Object<string, Array<ZOrderEntry>>}
     * @private
     */
    this.groups_ = null;
  }

  /**
   * @return {ol.Map}
   */
  getMap() {
    return this.map_ ? this.map_ : getMapContainer().getMap();
  }

  /**
   * Clears the data
   */
  clear() {
    this.groups_ = null;
    Settings.getInstance().set(['map', 'z-order'], this.groups_);
  }

  /**
   * Initializes the Z-Order structure
   *
   * @private
   */
  init_() {
    if (!this.groups_) {
      this.groups_ = /** @type {Object<string, Array<ZOrderEntry>>} */ (
        Settings.getInstance().get(['map', 'z-order']) || {});

      this.expire_();
    }
  }

  /**
   * @param {string} id
   * @return {?string} The Z-Order group type
   */
  getZType(id) {
    if (!this.groups_ || !id) {
      return null;
    }

    for (var type in this.groups_) {
      var list = /** @type {Array<ZOrderEntry>} */ (this.groups_[type] || []);

      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].id == id) {
          return type;
        }
      }
    }

    return null;
  }

  /**
   * Gets the Z-order index for a layer's ID.
   * @param {string} id
   * @return {number} The Z-Order group type
   */
  getIndex(id) {
    if (!this.groups_ || !id) {
      return -1;
    }

    for (var type in this.groups_) {
      var list = /** @type {Array<ZOrderEntry>} */ (this.groups_[type] || []);

      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].id == id) {
          return i;
        }
      }
    }

    return -1;
  }

  /**
   * Merges the current z-order structure from the map
   *
   * @private
   */
  mergeFromMap_() {
    var layers = this.getMap().getLayers().getArray();

    for (var i = 0, n = layers.length; i < n; i++) {
      var group = /** @type {LayerGroup} */ (layers[i]);
      var type = group.getOSType() || '';
      var list = /** @type {Array<ZOrderEntry>} */ (this.groups_[type] || []);

      var groupLayers = group.getLayers().getArray();
      for (var j = 0, m = groupLayers.length; j < m; j++) {
        var layer = /** @type {ILayer} */ (groupLayers[j]);

        var found = false;
        for (var k = 0, l = list.length; k < l; k++) {
          if (list[k].id == layer.getId()) {
            found = true;
            list[k].time = Date.now();
            break;
          }
        }

        if (!found) {
          list.push({
            id: layer.getId(),
            time: Date.now()
          });
        }
      }

      this.groups_[type] = list;
    }
  }

  /**
   * Updates the Z-Order of the layers on the map
   */
  update() {
    this.init_();
    this.mergeFromMap_();

    var layers = this.getMap().getLayers().getArray();
    var zIndex = 0;

    for (var i = 0, n = layers.length; i < n; i++) {
      var group = /** @type {LayerGroup} */ (layers[i]);
      var type = group.getOSType() || '';
      var list = /** @type {Array<ZOrderEntry>} */ (this.groups_[type]);

      if (list) {
        var groupLayers = group.getLayers().getArray();
        var prev = groupLayers.slice();
        groupLayers.sort(
            /**
             * @param {ILayer|BaseLayer} a
             * @param {ILayer|BaseLayer} b
             * @return {number}
             */
            function(a, b) {
              var ai = -1;
              var bi = -1;

              for (var i = 0, n = list.length; i < n; i++) {
                if (list[i].id == a.getId()) {
                  ai = i;
                }

                if (list[i].id == b.getId()) {
                  bi = i;
                }

                if (ai > -1 && bi > -1) {
                  break;
                }
              }

              return ai - bi;
            });

        // reset z-index for all layers in the group. groups should be handled from low to high z-index and the layers
        // array is also in low to high order.
        for (var j = 0; j < groupLayers.length; j++) {
          groupLayers[j].setZIndex(zIndex++);
        }

        if (!olArray.equals(prev, groupLayers)) {
          group.dispatchEvent(ZOrderEventType.UPDATE);
          group.changed();
        }
      }
    }

    // dispatch a global Z-order update event
    this.dispatchEvent(ZOrderEventType.UPDATE);
  }

  /**
   * Move an item after another item
   *
   * @param {string} id
   * @param {string} target
   * @return {boolean}
   */
  moveAfter(id, target) {
    return this.move(id, target, true);
  }

  /**
   * Move an item before another item
   *
   * @param {string} id
   * @param {string} target
   * @return {boolean}
   */
  moveBefore(id, target) {
    return this.move(id, target, false);
  }

  /**
   * Move an item as high as possible, giving precedence to 'sticky' items
   *
   * @param {string} id
   * @return {boolean}
   */
  moveHighestAndUpdate(id) {
    if (!this.groups_) {
      return false;
    }

    // Find the group with the ID.
    // If it already exists, it doesn't need to move
    for (var groupKey in this.groups_) {
      var search = this.groups_[groupKey];
      var found = false;
      for (var i = 0; i < search.length; i++) {
        if (search[i].id == id) {
          found = true;
          break;
        }
      }
      if (found) {
        this.update();
        return true;
      }
    }

    // Run the mergemap, but keep track of the group the id gets added to
    var layers = this.getMap().getLayers().getArray();

    var addedGroup = undefined;
    var list = [];
    for (var i = 0, n = layers.length; i < n; i++) {
      var group = /** @type {LayerGroup} */ (layers[i]);
      var type = group.getOSType() || '';
      list = /** @type {Array<ZOrderEntry>} */ (this.groups_[type] || []);

      var groupLayers = group.getLayers().getArray();
      for (var j = 0, m = groupLayers.length; j < m; j++) {
        var layer = /** @type {ILayer} */ (groupLayers[j]);

        var found = false;
        for (var k = 0, l = list.length; k < l; k++) {
          if (list[k].id == layer.getId()) {
            found = true;
            list[k].time = Date.now();
            break;
          }
        }

        if (!found) {
          list.push({
            id: layer.getId(),
            time: Date.now()
          });
        }

        if (layer.getId() == id) {
          addedGroup = group;
          break;
        }
      }

      if (addedGroup != null) {
        break;
      }
    }

    if (addedGroup == null) {
      return false;
    }

    // Move up the array, trying to find the first non-sticky element to put this one before
    var moveAfterID = undefined;
    var searchLayers = addedGroup.getLayers().getArray();
    for (var m = searchLayers.length - 2; m >= 0; m--) {
      var searchLayer = /** @type {VectorLayer} */ (searchLayers[m]);
      if (!searchLayer.isSticky()) {
        moveAfterID = searchLayer.getId();
        break;
      }
    }

    if (moveAfterID === undefined) {
      this.moveBefore(id, /** @type {VectorLayer} */ (searchLayers[0]).getId());
    } else {
      this.moveAfter(id, moveAfterID);
    }

    this.update();

    return true;
  }

  /**
   * Move an item
   *
   * @param {string} id
   * @param {string} otherId
   * @param {boolean=} opt_after True if id comes after otherId, False for id before otherId. Defaults to false
   * @return {boolean} True if moved, false otherwise
   */
  move(id, otherId, opt_after) {
    if (!this.groups_ || !id || !otherId || id === otherId) {
      return false;
    }

    var moved = false;

    // find the ID
    for (var groupKey in this.groups_) {
      var list = this.groups_[groupKey];

      var index = -1;
      var otherIndex = -1;
      var groupDone = false;

      for (var i = 0, n = list.length; i < n; i++) {
        if (list[i].id == id) {
          groupDone = true;
          index = i;
        }

        if (list[i].id == otherId) {
          otherIndex = i;
        }

        if (index > -1 && otherIndex > -1) {
          var item = list.splice(index, 1)[0];

          if (index < otherIndex) {
            otherIndex--;
          }

          list.splice(otherIndex + (opt_after ? 1 : 0), 0, item);
          moved = true;
          break;
        }
      }

      if (groupDone) {
        break;
      }
    }

    return moved;
  }

  /**
   * Saves the Z-Order data to settings
   */
  save() {
    this.init_();
    this.mergeFromMap_();
    Settings.getInstance().set(['map', 'z-order'], this.groups_);
  }

  /**
   * Ditch old data
   *
   * @private
   */
  expire_() {
    if (this.groups_) {
      var now = Date.now();

      for (var groupId in this.groups_) {
        var list = this.groups_[groupId];

        var i = list.length;
        while (i--) {
          if (now - list[i].time > ZOrder.MAX_AGE_) {
            list.splice(i, 1);
          }
        }
      }
    }
  }

  /**
   * Get the global instance.
   * @return {!ZOrder}
   */
  static getInstance() {
    if (!instance) {
      instance = new ZOrder();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {ZOrder} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {ZOrder|undefined}
 */
let instance;


/**
 * @const
 * @private
 * @type {number}
 */
ZOrder.MAX_AGE_ = 30 * 24 * 60 * 60 * 1000;
