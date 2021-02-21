goog.provide('os.data.ZOrder');
goog.provide('os.data.ZOrderEntry');
goog.provide('os.data.ZOrderEventType');

goog.require('goog.events.EventTarget');
goog.require('ol.array');
goog.require('os.config.Settings');


/**
 * @enum {string}
 */
os.data.ZOrderEventType = {
  UPDATE: 'zOrderUpdate'
};


/**
 * @typedef {{id: string, time: number}}
 */
os.data.ZOrderEntry;



/**
 * Maintains Z-Order for layers between sessions
 *
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.data.ZOrder = function() {
  os.data.ZOrder.base(this, 'constructor');

  /**
   * @type {?ol.Map}
   * @private
   */
  this.map_ = null;

  /**
   * @type {?Object.<string, Array.<os.data.ZOrderEntry>>}
   * @private
   */
  this.groups_ = null;
};
goog.inherits(os.data.ZOrder, goog.events.EventTarget);
goog.addSingletonGetter(os.data.ZOrder);


/**
 * @const
 * @private
 * @type {number}
 */
os.data.ZOrder.MAX_AGE_ = 30 * 24 * 60 * 60 * 1000;


/**
 * @return {ol.Map}
 */
os.data.ZOrder.prototype.getMap = function() {
  return this.map_ ? this.map_ : os.MapContainer.getInstance().getMap();
};


/**
 * Clears the data
 */
os.data.ZOrder.prototype.clear = function() {
  this.groups_ = null;
  os.settings.set(['map', 'z-order'], this.groups_);
};


/**
 * Initializes the Z-Order structure
 *
 * @private
 */
os.data.ZOrder.prototype.init_ = function() {
  if (!this.groups_) {
    this.groups_ = /** @type {Object.<string, Array.<os.data.ZOrderEntry>>} */ (
      os.settings.get(['map', 'z-order']) || {});

    this.expire_();
  }
};


/**
 * @param {string} id
 * @return {?string} The Z-Order group type
 */
os.data.ZOrder.prototype.getZType = function(id) {
  if (!this.groups_ || !id) {
    return null;
  }

  for (var type in this.groups_) {
    var list = /** @type {Array.<os.data.ZOrderEntry>} */ (this.groups_[type] || []);

    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].id == id) {
        return type;
      }
    }
  }

  return null;
};


/**
 * Gets the Z-order index for a layer's ID.
 * @param {string} id
 * @return {number} The Z-Order group type
 */
os.data.ZOrder.prototype.getIndex = function(id) {
  if (!this.groups_ || !id) {
    return -1;
  }

  for (var type in this.groups_) {
    var list = /** @type {Array.<os.data.ZOrderEntry>} */ (this.groups_[type] || []);

    for (var i = 0, n = list.length; i < n; i++) {
      if (list[i].id == id) {
        return i;
      }
    }
  }

  return -1;
};


/**
 * Merges the current z-order structure from the map
 *
 * @private
 */
os.data.ZOrder.prototype.mergeFromMap_ = function() {
  var layers = this.getMap().getLayers().getArray();

  for (var i = 0, n = layers.length; i < n; i++) {
    var group = /** @type {os.layer.Group} */ (layers[i]);
    var type = group.getOSType() || '';
    var list = /** @type {Array.<os.data.ZOrderEntry>} */ (this.groups_[type] || []);

    var groupLayers = group.getLayers().getArray();
    for (var j = 0, m = groupLayers.length; j < m; j++) {
      var layer = /** @type {os.layer.ILayer} */ (groupLayers[j]);

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
};


/**
 * Updates the Z-Order of the layers on the map
 */
os.data.ZOrder.prototype.update = function() {
  this.init_();
  this.mergeFromMap_();

  var layers = this.getMap().getLayers().getArray();
  var zIndex = 0;

  for (var i = 0, n = layers.length; i < n; i++) {
    var group = /** @type {os.layer.Group} */ (layers[i]);
    var type = group.getOSType() || '';
    var list = /** @type {Array.<os.data.ZOrderEntry>} */ (this.groups_[type]);

    if (list) {
      var groupLayers = group.getLayers().getArray();
      var prev = groupLayers.slice();
      groupLayers.sort(
          /**
           * @param {os.layer.ILayer|ol.layer.Base} a
           * @param {os.layer.ILayer|ol.layer.Base} b
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

      if (!ol.array.equals(prev, groupLayers)) {
        group.dispatchEvent(os.data.ZOrderEventType.UPDATE);
        group.changed();
      }
    }
  }

  this.dispatchEvent('zOrder:update');
};


/**
 * Move an item after another item
 *
 * @param {string} id
 * @param {string} target
 * @return {boolean}
 */
os.data.ZOrder.prototype.moveAfter = function(id, target) {
  return this.move(id, target, true);
};


/**
 * Move an item before another item
 *
 * @param {string} id
 * @param {string} target
 * @return {boolean}
 */
os.data.ZOrder.prototype.moveBefore = function(id, target) {
  return this.move(id, target, false);
};


/**
 * Move an item as high as possible, giving precedence to 'sticky' items
 *
 * @param {string} id
 * @return {boolean}
 */
os.data.ZOrder.prototype.moveHighestAndUpdate = function(id) {
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
    var group = /** @type {os.layer.Group} */ (layers[i]);
    var type = group.getOSType() || '';
    list = /** @type {Array.<os.data.ZOrderEntry>} */ (this.groups_[type] || []);

    var groupLayers = group.getLayers().getArray();
    for (var j = 0, m = groupLayers.length; j < m; j++) {
      var layer = /** @type {os.layer.ILayer} */ (groupLayers[j]);

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
    var searchLayer = /** @type {os.layer.Vector} */ (searchLayers[m]);
    if (!searchLayer.isSticky()) {
      moveAfterID = searchLayer.getId();
      break;
    }
  }

  if (moveAfterID === undefined) {
    this.moveBefore(id, /** @type {os.layer.Vector} */ (searchLayers[0]).getId());
  } else {
    this.moveAfter(id, moveAfterID);
  }

  this.update();

  return true;
};


/**
 * Move an item
 *
 * @param {string} id
 * @param {string} otherId
 * @param {boolean=} opt_after True if id comes after otherId, False for id before otherId. Defaults to false
 * @return {boolean} True if moved, false otherwise
 */
os.data.ZOrder.prototype.move = function(id, otherId, opt_after) {
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
};


/**
 * Saves the Z-Order data to settings
 */
os.data.ZOrder.prototype.save = function() {
  this.init_();
  this.mergeFromMap_();
  os.settings.set(['map', 'z-order'], this.groups_);
};


/**
 * Ditch old data
 *
 * @private
 */
os.data.ZOrder.prototype.expire_ = function() {
  if (this.groups_) {
    var now = Date.now();

    for (var groupId in this.groups_) {
      var list = this.groups_[groupId];

      var i = list.length;
      while (i--) {
        if (now - list[i].time > os.data.ZOrder.MAX_AGE_) {
          list.splice(i, 1);
        }
      }
    }
  }
};

