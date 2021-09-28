goog.declareModuleId('os.search');

import osImplements from '../implements.js';
import IGeoSearch from './igeosearch.js';
import ITemporalSearch from './itemporalsearch.js';
import SortOrder from './sortorder.js';

const {default: ISearch} = goog.requireType('os.search.ISearch');


/**
 * The base key for search settings.
 * @type {string}
 */
export const BASE_KEY = 'search';

/**
 * Legacy name used to search all sources. Keeping this around for the purpose of migrating old recent searches.
 * @type {string}
 */
export const SEARCH_ALL = 'Search All Sources';

/**
 * @enum {string}
 */
export const SearchSetting = {
  // global search settings
  RECENT: BASE_KEY + '.recentlocal',

  // provider specific settings - retrieve these with {@link os.search.getSettingKey}
  ENABLED: 'enabled'
};

/**
 * @enum {string}
 */
export const SubSearchSetting = {
  ENABLED: 'ss'
};

/**
 * Get the setting key for a search provider.
 *
 * @param {!ISearch} search The search provider
 * @param {string} key The setting
 * @return {string}
 */
export const getSettingKey = function(search, key) {
  return [BASE_KEY, search.getId(), key].join('.');
};

/**
 * Get the identifier for a search provider. Convenience for Array functions.
 *
 * @param {!ISearch} search The search provider
 * @return {string}
 */
export const getSearchId = function(search) {
  return search.getId();
};

/**
 * Get the name for a search provider. Convenience for Array functions.
 *
 * @param {!ISearch} search The search provider
 * @return {string}
 */
export const getSearchName = function(search) {
  return search.getName();
};

/**
 * Get the name for a search provider. Convenience for Array functions.
 *
 * @param {string} name The name to test
 * @param {!ISearch} search The search provider
 * @return {boolean}
 */
export const isNameEqual = function(name, search) {
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
export const pageResults = function(results, opt_start, opt_pageSize) {
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
export const dateScore = function(time, order) {
  if (time || time == 0) {
    if (order == SortOrder.DESC) {
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
 * @param {ISearch} search The search.
 * @return {boolean} Whether it implements and supports geosearch.
 */
export const supportsGeoSearch = function(search) {
  if (search && osImplements(search, IGeoSearch.ID)) {
    var s = /** @type {os.search.IGeoSearch} */ (search);
    return s.supportsGeoDistance() || s.supportsGeoExtent() || s.supportsGeoShape();
  }

  return false;
};

/**
 * Get whether a search supports temporal search.
 * @param {ISearch} search The search.
 * @return {boolean} Whether it implements and supports temporal search.
 */
export const supportsTemporalSearch = function(search) {
  if (search && osImplements(search, ITemporalSearch.ID)) {
    var s = /** @type {ITemporalSearch} */ (search);
    return s.supportsDateRange() || s.supportsStartDate() || s.supportsEndDate();
  }

  return false;
};
