goog.declareModuleId('os.ui.filter.FilterEventType');

/**
 * @enum {string}
 */
const FilterEventType = {
  FILTERS_CHANGED: 'filtersChanged',
  GROUPING_CHANGED: 'filterGroupingChanged',
  HANDLERS_CHANGED: 'filterHandlersChanged',
  FILTERS_REFRESH: 'filtersRefresh',
  FILTERS_IMPORTED: 'filtersImported',
  ADD_FILTER: 'addFilter',
  EXPORT_FILTER: 'exportFilter'
};

export default FilterEventType;
