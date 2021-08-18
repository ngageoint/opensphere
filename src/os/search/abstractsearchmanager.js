goog.module('os.search.AbstractSearchManager');
goog.module.declareLegacyNamespace();

const {defaultCompare} = goog.require('goog.array');
const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');
const {hashCode} = goog.require('goog.string');
const SearchEventType = goog.require('os.search.SearchEventType');
const FavoriteManager = goog.require('os.user.settings.FavoriteManager');
const FavoriteType = goog.require('os.user.settings.FavoriteType');

const Favorite = goog.requireType('os.search.Favorite');
const ISearch = goog.requireType('os.search.ISearch');
const ISearchResult = goog.requireType('os.search.ISearchResult');
const SearchEvent = goog.requireType('os.search.SearchEvent');
const FavoriteSetting = goog.requireType('os.user.settings.favorite');


/**
 * Responsible for executing search terms against the registered search managers
 *
 * @abstract
 */
class AbstractSearchManager extends EventTarget {
  /**
   * Constructor.
   * @param {string=} opt_id
   * @param {string=} opt_name
   */
  constructor(opt_id, opt_name) {
    super();
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
     * @type {function (Array<FavoriteSetting>): Array<Favorite>}
     * @private
     */
    this.filterFavorites_ = this.defaultFilterFavorites_;
  }

  /**
   * Get the search manager id
   *
   * @return {string}
   * @export
   */
  getId() {
    return this.id_;
  }

  /**
   * Get the search manager id hash code
   *
   * @return {number}
   * @export
   */
  getIdHashCode() {
    return hashCode(this.id_);
  }

  /**
   * Get the search manager name
   *
   * @return {string}
   * @export
   */
  getName() {
    return this.name_;
  }

  /**
   * Get the function to determine no result class.
   *
   * @return {Function}
   */
  getNoResultClass() {
    return this.noResultClass_;
  }

  /**
   * @param {Function} noResultClass
   */
  setNoResultClass(noResultClass) {
    this.noResultClass_ = noResultClass;
  }

  /**
   * Sets the last term.
   *
   * @param {string} term
   */
  setTerm(term) {
    this.term_ = term;
  }

  /**
   * Gets the last term.
   *
   * @return {string}
   */
  getTerm() {
    return this.term_;
  }

  /**
   * Sets the sort term.
   *
   * @param {string} sortBy
   */
  setSort(sortBy) {
    this.sortBy_ = sortBy;
  }

  /**
   * Gets the sort term.
   *
   * @return {string}
   */
  getSort() {
    return this.sortBy_;
  }

  /**
   * Gets favorite searches
   *
   * @param {number=} opt_max max number of reusltes to return.
   * @return {Array<Favorite>} array of favorite items
   */
  getFavorites(opt_max) {
    var favorites = [];
    if (this.filterFavorites_) {
      const fm = FavoriteManager.getInstance();
      favorites = this.filterFavorites_(fm.filter(fm.getFavorites(), [FavoriteType.SEARCH], opt_max));
    }

    return favorites;
  }

  /**
   * register the filter favorites function
   *
   * @param {function (Array<FavoriteSetting>): Array<Favorite>} fn
   */
  registerFilterFavoritesFn(fn) {
    this.filterFavorites_ = fn;
  }

  /**
   * Handle autocomplete failure event for a single search provider.
   *
   * @param {SearchEvent} event
   * @protected
   */
  handleAutocompleteFailure(event) {
    this.dispatchEvent(new GoogEvent(SearchEventType.AUTOCOMPLETEFAIL));
  }

  /**
   * Compares two search results by their score, for sorting in descending order.
   *
   * @param {ISearchResult} a First result
   * @param {ISearchResult} b Second result
   * @return {number}
   * @protected
   */
  scoreCompare(a, b) {
    // default is ascending order, so flip the sign
    return -defaultCompare(a.getScore(), b.getScore());
  }

  /**
   * Filter favorites to only enabled providers
   *
   * @param {Array<FavoriteSetting>} favorites
   * @return {Array<Favorite>}
   * @private
   */
  defaultFilterFavorites_(favorites) {
    return [];
  }

  /**
   * Is the search manager a container for other search managers
   *
   * @return {boolean}
   */
  isContainer() {
    return false;
  }

  /**
   * Execute search using registered searches.
   *
   * @abstract
   * @param {string} term The keyword search term
   * @param {number=} opt_start The index of the search results page
   * @param {number=} opt_pageSize The number of results to include per page
   * @param {string=} opt_sortBy The sort by string
   * @param {boolean=} opt_force Force a search
   * @param {boolean=} opt_noFacets flag for indicating facet search is not needed
   * @param {string=} opt_sortOrder The sort order
   */
  search(term, opt_start, opt_pageSize, opt_sortBy, opt_force, opt_noFacets, opt_sortOrder) {}

  /**
   * Requests autocomplete results from a search term.
   *
   * @abstract
   * @param {string} term The keyword to use in the search
   * @param {number=} opt_maxResults The maximum number of autocomplete results.
   */
  autocomplete(term, opt_maxResults) {}

  /**
   * Clear the search results.
   *
   * @abstract
   * @param {string=} opt_term A default search term. If not provided, the term will be cleared.
   */
  clear(opt_term) {}

  /**
   * Retrieve the total number of search results
   *
   * @abstract
   * @return {number}
   */
  getTotal() {}

  /**
   * Retrieve the identifying names of all the registered searches.
   *
   * @abstract
   * @param {boolean=} opt_excludeExternal
   * @return {!Array<!ISearch>}
   */
  getRegisteredSearches(opt_excludeExternal) {}

  /**
   * Get the search providers that are currently enabled, and
   * optionally support the search term.
   *
   * @abstract
   * @param {string=} opt_term
   * @return {!Array<!ISearch>}
   */
  getEnabledSearches(opt_term) {}

  /**
   * Retrieve search results as they have been captured be all searches or for a specitic search
   *
   * @abstract
   * @param {number=} opt_limit
   * @return {Array} A shallow copy of the search results
   */
  getResults(opt_limit) {}

  /**
   * Force events to fire indicating whether there is a search in progress.
   *
   * @abstract
   */
  checkProgress() {}

  /**
   * Gets the providers still loading.
   *
   * @abstract
   * @return {!Object<string, boolean>} object of loading providers
   */
  getLoading() {}

  /**
   * @abstract
   * @return {boolean} whether providers are still loading
   */
  isLoading() {}
}

exports = AbstractSearchManager;
