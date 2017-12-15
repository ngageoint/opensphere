goog.provide('os.search.SearchEvent');
goog.provide('os.search.SearchEventType');
goog.require('goog.events.Event');
goog.require('os.search.ISearchResult');



/**
 * @param {string} type The event type
 * @param {?string} term The query term of the search
 * @param {Array<os.search.ISearchResult>=} opt_results The search results
 * @param {number=} opt_total Total number of results, regardless of page size. If not provided, the length of the
 *   results array will be used.
 * @param {Object=} opt_target Reference to the object that is the target of this event
 * @extends {goog.events.Event}
 * @constructor
 */
os.search.SearchEvent = function(type, term, opt_results, opt_total, opt_target) {
  os.search.SearchEvent.base(this, 'constructor', type, opt_target);

  /**
   * @type {Array.<os.search.ISearchResult>}
   * @private
   */
  this.results_ = opt_results || [];

  /**
   * @type {?string}
   * @private
   */
  this.term_ = term;

  /**
   * @type {number}
   * @private
   */
  this.total_ = goog.isDef(opt_total) ? opt_total : opt_results ? opt_results.length : 0;
};
goog.inherits(os.search.SearchEvent, goog.events.Event);


/**
 * Event types for search events
 * @enum {string}
 */
os.search.SearchEventType = {
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
  SEARCH_TERM: 'change:searchTerm'
};


/**
 * @return {?string}
 */
os.search.SearchEvent.prototype.getTerm = function() {
  return this.term_;
};


/**
 * @return {?string}
 */
os.search.SearchEvent.prototype.getSearchTerm = function() {
  return this.term_;
};


/**
 * @return {Array.<os.search.ISearchResult>}
 */
os.search.SearchEvent.prototype.getResults = function() {
  return this.results_;
};


/**
 * Retrieve the total number of search results, regardless of page size
 * @return {number} The total number of search results.
 */
os.search.SearchEvent.prototype.getTotal = function() {
  return this.total_;
};
