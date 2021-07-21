goog.module('os.events.SelectionType');
goog.module.declareLegacyNamespace();


/**
 * @enum {string}
 */
exports = {
  ADDED: 'selectedItemsAdded',
  CHANGED: 'selectedItemsChanged',
  REMOVED: 'selectedItemsRemoved',
  CLEAR: 'selectedItemsCleared'
};
