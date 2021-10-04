goog.declareModuleId('os.data.event.DataEventType');

/**
 * @enum {string}
 */
const DataEventType = {
  SOURCE_ADDED: 'dataSourceAdded',
  SOURCE_REMOVED: 'dataSourceRemoved',
  SOURCE_REMOVED_NO_DESTROY: 'dataSourceRemovedNotDestroyed',
  FILTERS_CHANGED: 'filtersChanged',
  DATA_ADDED: 'dataAdded',
  DATA_REMOVED: 'dataRemoved',
  MAX_FEATURES: 'maxFeatures'
};

export default DataEventType;
