goog.module('os.ui.list');

const EventTarget = goog.require('goog.events.EventTarget');
const PropertyChangeEvent = goog.require('os.events.PropertyChangeEvent');


/**
 * @typedef {{
 *    markup: string,
 *    priority: number,
 *    element: (angular.JQLite|undefined),
 *    scope: (angular.Scope|undefined)
 *  }}
 */
let ListEntry;

/**
 * @type {!EventTarget}
 */
const dispatcher = new EventTarget();

/**
 * @type {Object<string, Array<ListEntry>>}
 */
const entryMap = {};

/**
 * Get the list dispatcher.
 * @return {!EventTarget}
 */
const getDispatcher = () => dispatcher;

/**
 * @param {string} id The list ID to which to add
 * @param {string} markup The directive or markup to add
 * @param {number=} opt_priority The sort priority (lowest to highest)
 */
const add = function(id, markup, opt_priority) {
  var map = entryMap;

  if (!(id in map)) {
    map[id] = [];
  }

  map[id].push({
    markup: markup,
    priority: opt_priority || 0
  });

  map[id].sort(sort_);
  dispatcher.dispatchEvent(new PropertyChangeEvent(id));
};

/**
 * @param {string} id The list ID to which to check
 * @param {string} markup The directive or markup to delete
 */
const remove = function(id, markup) {
  var map = entryMap[id];
  if (map) {
    var itemIdx = map.findIndex(function(item) {
      return item.markup == markup;
    });
    if (itemIdx > -1) {
      const item = map[itemIdx];
      if (item.scope) {
        item.scope.$destroy();
        item.scope = undefined;
      }

      map.splice(itemIdx, 1);

      entryMap[id] = map;
      dispatcher.dispatchEvent(new PropertyChangeEvent(id, null, item));
    }
  }
};

/**
 * Remove a list by ID.
 *
 * @param {string} id The list ID to remove
 */
const removeList = function(id) {
  var map = entryMap[id];
  if (map) {
    map.forEach(function(item) {
      if (item) {
        if (item.scope) {
          item.scope.$destroy();
          item.scope = undefined;
        }

        if (item.element) {
          item.element.remove();
          item.element = undefined;
        }
      }
    });

    delete entryMap[id];
  }
};

/**
 * Copy a list under a new ID.
 *
 * @param {string} sourceId The original list ID.
 * @param {string} targetId The new list ID.
 */
const copy = function(sourceId, targetId) {
  if (sourceId !== targetId) {
    var items = get(sourceId);
    if (items) {
      items.forEach(function(item) {
        add(targetId, item.markup, item.priority);
      });
    }
  }
};

/**
 * @param {ListEntry} a list entry 1
 * @param {ListEntry} b list entry 2
 * @return {number} per typical compare function
 */
const sort_ = function(a, b) {
  return a.priority - b.priority;
};

/**
 * @param {string} id The list ID to get
 * @return {?Array<!ListEntry>} the list or null if not found
 */
const get = function(id) {
  return entryMap[id] || null;
};

/**
 * Checks to see if the markup already exists in the list
 *
 * @param {string} id The list ID to which to check
 * @param {string} markup The directive or markup to check
 * @return {boolean} if the markup was found or not
 */
const exists = function(id, markup) {
  var found = null;
  var map = entryMap[id];
  if (map) {
    found = map.find(function(item) {
      return item.markup == markup;
    });
  }
  return !!found;
};

exports = {
  ListEntry,
  getDispatcher,
  add,
  remove,
  removeList,
  copy,
  get,
  exists
};
