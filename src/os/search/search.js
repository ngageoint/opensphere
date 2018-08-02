goog.provide('os.search');


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
  RECENT: os.search.BASE_KEY + '.recent',

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
 * Get the setting key for a search provider.
 * @param {!os.search.ISearch} search The search provider
 * @param {string} key The setting
 * @return {string}
 */
os.search.getSettingKey = function(search, key) {
  return [os.search.BASE_KEY, search.getId(), key].join('.');
};


/**
 * Get the identifier for a search provider. Convenience for Array functions.
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.search.getSearchId = function(search) {
  return search.getId();
};


/**
 * Get the name for a search provider. Convenience for Array functions.
 * @param {!os.search.ISearch} search The search provider
 * @return {string}
 */
os.search.getSearchName = function(search) {
  return search.getName();
};


/**
 * Get the name for a search provider. Convenience for Array functions.
 * @param {string} name The name to test
 * @param {!os.search.ISearch} search The search provider
 * @return {boolean}
 */
os.search.isNameEqual = function(name, search) {
  return search.getName() == name;
};


/**
 * Do local paging of results
 * @param {!Array} results
 * @param {number=} opt_start
 * @param {number=} opt_pageSize
 * @return {!Array}
 */
os.search.pageResults = function(results, opt_start, opt_pageSize) {
  if (goog.isDef(opt_start) && goog.isDef(opt_pageSize)) {
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
