goog.provide('os.search');
goog.provide('os.search.SortOrder');
goog.provide('os.search.SortType');

goog.require('os.search.ITemporalSearch');


/**
 * The base key for search settings.
 * @type {string}
 */
os.search.BASE_KEY = 'search';


/**
 * Legacy name used to search all sources. Keeping this around for the purpose of migrating old recent searches.
 * @type {string}
 * @const
 */
os.search.SEARCH_ALL = 'Search All Sources';


/**
 * @enum {string}
 */
os.search.SearchSetting = {
  // global search settings
  RECENT: os.search.BASE_KEY + '.recentlocal',

  // provider specific settings - retrieve these with {@link os.search.getSettingKey}
  ENABLED: 'enabled'
};


/**
 * @enum {string}
 */
os.search.SortType = {
  DATE: 'Date',
  RELEVANCE: 'Relevance'
};


/**
 * @enum {string}
 */
os.search.SortOrder = {
  ASC: 'asc',
  DESC: 'desc'
};


/**
 * Get the setting key for a search provider.
 *
 * @param {!os.search.ISearch} search The search provider
 * @param {string} key The setting
 * @return {string}
 */
os.search.getSettingKey = function(search, key) {
  return [os.search.BASE_KEY, search.getId(), key].join('.');
};


/**
 * Get the identifier for a search provider. Convenience for Array functions.
 *
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.search.getSearchId = function(search) {
  return search.getId();
};


/**
 * Get the name for a search provider. Convenience for Array functions.
 *
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.search.getSearchName = function(search) {
  return search.getName();
};


/**
 * Get the name for a search provider. Convenience for Array functions.
 *
 * @param {string} name The name to test
 * @param {!os.search.ISearch} search The search provider
 * @return {boolean}
 */
os.search.isNameEqual = function(name, search) {
  return search.getName() == name;
};


/**
 * Do local paging of results
 *
 * @param {!Array} results
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @return {!Array}
 */
os.search.pageResults = function(results, opt_start, opt_pageSize) {
  if (opt_start !== undefined && opt_pageSize !== undefined) {
    var startIndex = opt_start * opt_pageSize;
    if (startIndex > results.length) {
      return [];
    } else {
      var endIndex = startIndex + opt_pageSize;
      if (endIndex > results.length) {
        endIndex = undefined;
      }
      return results.slice(startIndex, endIndex);
    }
  } else {
    return results;
  }
};


/**
 * Create a score for date sorting by sort order
 *
 * @param {number} time
 * @param {string} order
 * @return {number}
 */
os.search.dateScore = function(time, order) {
  if (time || time == 0) {
    if (order == os.search.SortOrder.DESC) {
      return time;
    } else {
      return new Date().getTime() - time;
    }
  } else {
    return 0;
  }
};


/**
 * Get whether a search supports geosearch.
 * @param {os.search.ISearch} search The search.
 * @return {boolean} Whether it implements and supports geosearch.
 */
os.search.supportsGeoSearch = function(search) {
  if (search && os.implements(search, os.search.IGeoSearch.ID)) {
    var s = /** @type {os.search.IGeoSearch} */ (search);
    return s.supportsGeoDistance() || s.supportsGeoExtent() || s.supportsGeoShape();
  }

  return false;
};


/**
 * Get whether a search supports temporal search.
 * @param {os.search.ISearch} search The search.
 * @return {boolean} Whether it implements and supports temporal search.
 */
os.search.supportsTemporalSearch = function(search) {
  if (search && os.implements(search, os.search.ITemporalSearch.ID)) {
    var s = /** @type {os.search.ITemporalSearch} */ (search);
    return s.supportsDateRange() || s.supportsStartDate() || s.supportsEndDate();
  }

  return false;
};
