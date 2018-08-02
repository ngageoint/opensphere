goog.provide('os.events.SelectionType');


/**
 * @enum {string}
 */
os.events.SelectionType = {
  ADDED: 'selectedItemsAdded',
  CHANGED: 'selectedItemsChanged',
  REMOVED: 'selectedItemsRemoved',
  CLEAR: 'selectedItemsCleared'
};


/**
 * Test if an event type is a selection type.
 * @param {?string} type The event type
 * @return {boolean}
 */
os.events.isSelectionType = function(type) {
  return !!type && goog.object.containsValue(os.events.SelectionType, type);
};
