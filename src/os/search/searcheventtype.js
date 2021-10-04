goog.declareModuleId('os.search.SearchEventType');

/**
 * Event types for search events
 * @enum {string}
 */
const SearchEventType = {
  SUCCESS: 'success',
  ERROR: 'error',
  START: 'start',
  PROGRESS: 'progress',
  AUTOCOMPLETED: 'autocomplete.success',
  AUTOCOMPLETEFAIL: 'autocomplete.error',
  REFRESH: 'search.refresh',
  FACETLOAD: 'facet.success',
  FACET_OPTIONS_LOAD: 'facet.options.load',
  FACET_DETAILS_LOAD: 'facet.details.load',
  FAVORITE: 'favorite',
  SEARCH_TERM: 'change:searchTerm',
  GEO_SEARCH_CHANGE: 'change:geoSearch'
};

export default SearchEventType;
