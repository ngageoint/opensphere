goog.module('os.data.event.DataEventType');
goog.module.declareLegacyNamespace();

/**
 * @enum {string}
 */
exports = {
  SOURCE_ADDED: 'dataSourceAdded',
  SOURCE_REMOVED: 'dataSourceRemoved',
  SOURCE_REMOVED_NO_DESTROY: 'dataSourceRemovedNotDestroyed',
  FILTERS_CHANGED: 'filtersChanged',
  DATA_ADDED: 'dataAdded',
  DATA_REMOVED: 'dataRemoved',
  MAX_FEATURES: 'maxFeatures'
};
