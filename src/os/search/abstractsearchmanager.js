goog.provide('os.search.AbstractSearchManager');

goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');



/**
 * Responsible for executing search terms against the registered search managers
 * @param {string=} opt_id
 * @param {string=} opt_name
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.search.AbstractSearchManager = function(opt_id, opt_name) {
  os.search.AbstractSearchManager.base(this, 'constructor');
  /**
   * @type {string}
   * @private
   */
  this.id_ = opt_id || 'default';

  /**
   * @type {string}
   * @private
   */
  this.name_ = opt_name || this.id_;

  /**
   * @type {string}
   * @private
   */
  this.term_ = '';

  /**
   * @type {string}
   * @private
   */
  this.sortBy_ = '';

  /**
   * @type {?Function}
   * @private
   */
  this.noResultClass_ = null;

  /**
   * Function to filter out favorites
   * @type {function (Array<os.user.settings.favorite>): Array<os.search.Favorite>}
   * @private
   */
  this.filterFavorites_ = this.defaultFilterFavorites_;
};
goog.inherits(os.search.AbstractSearchManager, goog.events.EventTarget);


/**
 * Get the search manager id
 * @return {string}
 * @export
 */
os.search.AbstractSearchManager.prototype.getId = function() {
  return this.id_;
};


/**
 * Get the search manager id hash code
 * @return {number}
 * @export
 */
os.search.AbstractSearchManager.prototype.getIdHashCode = function() {
  return goog.string.hashCode(this.id_);
};


/**
 * Get the search manager name
 * @return {string}
 * @export
 */
os.search.AbstractSearchManager.prototype.getName = function() {
  return this.name_;
};


/**
 * Get the function to determine no result class.
 * @return {Function}
 */
os.search.AbstractSearchManager.prototype.getNoResultClass = function() {
  return this.noResultClass_;
};


/**
 * @param {Function} noResultClass
 */
os.search.AbstractSearchManager.prototype.setNoResultClass = function(noResultClass) {
  this.noResultClass_ = noResultClass;
};


/**
 * Sets the last term.
 * @param {string} term
 */
os.search.AbstractSearchManager.prototype.setTerm = function(term) {
  this.term_ = term;
};


/**
 * Gets the last term.
 * @return {string}
 */
os.search.AbstractSearchManager.prototype.getTerm = function() {
  return this.term_;
};


/**
 * Sets the sort term.
 * @param {string} sortBy
 */
os.search.AbstractSearchManager.prototype.setSort = function(sortBy) {
  this.sortBy_ = sortBy;
};


/**
 * Gets the sort term.
 * @return {string}
 */
os.search.AbstractSearchManager.prototype.getSort = function() {
  return this.sortBy_;
};


/**
 * Gets favorite searches
 * @param {number=} opt_max max number of reusltes to return.
 * @return {Array<os.search.Favorite>} array of favorite items
 */
os.search.AbstractSearchManager.prototype.getFavorites = function(opt_max) {
  var favorites = [];
  if (this.filterFavorites_) {
    favorites = this.filterFavorites_(os.favoriteManager.filter(os.favoriteManager.getFavorites(),
        [os.user.settings.FavoriteType.SEARCH], opt_max));
  }

  return favorites;
};


/**
 * register the filter favorites function
 * @param {function (Array<os.user.settings.favorite>): Array<os.search.Favorite>} fn
 */
os.search.AbstractSearchManager.prototype.registerFilterFavoritesFn = function(fn) {
  this.filterFavorites_ = fn;
};


/**
 * Handle autocomplete failure event for a single search provider.
 * @param {os.search.SearchEvent} event
 * @protected
 */
os.search.AbstractSearchManager.prototype.handleAutocompleteFailure = function(event) {
  this.dispatchEvent(new goog.events.Event(os.search.SearchEventType.AUTOCOMPLETEFAIL));
};


/**
 * Compares two search results by their score, for sorting in descending order.
 * @param {os.search.ISearchResult} a First result
 * @param {os.search.ISearchResult} b Second result
 * @return {number}
 * @protected
 */
os.search.AbstractSearchManager.prototype.scoreCompare = function(a, b) {
  // default is ascending order, so flip the sign
  return -goog.array.defaultCompare(a.getScore(), b.getScore());
};


/**
 * Filter favorites to only enabled providers
 * @param {Array<os.user.settings.favorite>} favorites
 * @return {Array<os.search.Favorite>}
 * @private
 */
os.search.AbstractSearchManager.prototype.defaultFilterFavorites_ = function(favorites) {
  return [];
};


/**
 * Is the search manager a container for other search managers
 * @return {boolean}
 */
os.search.AbstractSearchManager.prototype.isContainer = function() {
  return false;
};


/**
 * Execute search using registered searches.
 * @param {string} term The keyword search term
 * @param {number=} opt_start The index of the search results page
 * @param {number=} opt_pageSize The number of results to include per page
 * @param {string=} opt_sortBy The sort by string
 * @param {boolean=} opt_force Force a search
 * @param {boolean=} opt_noFacets flag for indicating facet search is not needed
 * @param {string=} opt_sortOrder The sort order
 */
os.search.AbstractSearchManager.prototype.search = goog.abstractMethod;


/**
 * Requests autocomplete results from a search term.
 * @param {string} term The keyword to use in the search
 * @param {number=} opt_maxResults The maximum number of autocomplete results.
 */
os.search.AbstractSearchManager.prototype.autocomplete = goog.abstractMethod;


/**
 * Clear the search results.
 * @param {string=} opt_term A default search term. If not provided, the term will be cleared.
 */
os.search.AbstractSearchManager.prototype.clear = goog.abstractMethod;


/**
 * Retrieve the total number of search results
 * @return {number}
 */
os.search.AbstractSearchManager.prototype.getTotal = goog.abstractMethod;


/**
 * Retrieve the identifying names of all the registered searches.
 * @return {!Array<!os.search.ISearch>}
 */
os.search.AbstractSearchManager.prototype.getRegisteredSearches = goog.abstractMethod;


/**
 * Get the search providers that are currently enabled, and
 * optionally support the search term.
 * @param {string=} opt_term
 * @return {!Array<!os.search.ISearch>}
 */
os.search.AbstractSearchManager.prototype.getEnabledSearches = goog.abstractMethod;


/**
 * Retrieve search results as they have been captured be all searches or for a specitic search
 * @param {number=} opt_limit
 * @return {Array} A shallow copy of the search results
 */
os.search.AbstractSearchManager.prototype.getResults = goog.abstractMethod;


/**
 * Force events to fire indicating whether there is a search in progress.
 */
os.search.AbstractSearchManager.prototype.checkProgress = goog.abstractMethod;


/**
 * Gets the providers still loading.
 * @return {!Object<string, boolean>} object of loading providers
 */
os.search.AbstractSearchManager.prototype.getLoading = goog.abstractMethod;


/**
 * @return {boolean} whether providers are still loading
 */
os.search.AbstractSearchManager.prototype.isLoading = goog.abstractMethod;



