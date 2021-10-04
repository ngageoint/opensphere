goog.declareModuleId('os.events.SelectionType');

/**
 * @enum {string}
 */
const SelectionType = {
  ADDED: 'selectedItemsAdded',
  CHANGED: 'selectedItemsChanged',
  REMOVED: 'selectedItemsRemoved',
  CLEAR: 'selectedItemsCleared'
};

export default SelectionType;
