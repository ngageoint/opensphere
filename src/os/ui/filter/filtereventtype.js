goog.module('os.ui.filter.FilterEventType');
goog.module.declareLegacyNamespace();

/**
 * @enum {string}
 */
exports = {
  FILTERS_CHANGED: 'filtersChanged',
  GROUPING_CHANGED: 'filterGroupingChanged',
  HANDLERS_CHANGED: 'filterHandlersChanged',
  FILTERS_REFRESH: 'filtersRefresh',
  FILTERS_IMPORTED: 'filtersImported',
  ADD_FILTER: 'addFilter',
  EXPORT_FILTER: 'exportFilter'
};
