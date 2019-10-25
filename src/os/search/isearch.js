goog.provide('os.search.ISearch');
goog.require('goog.events.Listenable');



/**
 *  The base interface for executing a search.
 *
 *  @extends {goog.events.Listenable}
 *  @interface
 */
os.search.ISearch = function() {};


/**
 * Execute a keyword search against a repository.
 * @param {string} term The keyword to use in the search
 * @param {number=} opt_start The start index of the page of results to return.
 *   Defaults to the first page.
 * @param {number=} opt_pageSize The number of results to return per page.
 *   Defaults to an appropriate value.
 * @param {string=} opt_sortBy The sort order for the search.
 *   The sort order to be used
 * @param {boolean=} opt_noFacets flag to indicate facets not needed
 * @param {string=} opt_sortOrder - the sort order
 * @return {boolean} Return true to continue, otherwise false.
 */
os.search.ISearch.prototype.search;


/**
 * Cancels any pending requests
 */
os.search.ISearch.prototype.cancel;


/**
 * Requests autocomplete results from a search term.
 * @param {string} term The keyword to use in the search
 * @param {number=} opt_maxResults The maximum number of autocomplete results.
 *   Defaults to an appropriate value.
 */
os.search.ISearch.prototype.autocomplete;


/**
 * Retrieve the unique identifier for the search.
 * @return {string}
 */
os.search.ISearch.prototype.getId;


/**
 * Retrieve the user-facing name for the search.
 * @return {string}
 */
os.search.ISearch.prototype.getName;


/**
 * Retrieve the search type for choosing search priority.
 * @return {string}
 */
os.search.ISearch.prototype.getType;


/**
 * Retrieve the priority for this search with respect to others of the same type.
 * @return {number}
 */
os.search.ISearch.prototype.getPriority;


/**
 * If the search is enabled.
 * @return {boolean}
 */
os.search.ISearch.prototype.isEnabled;


/**
 * Set if the search is enabled.
 * @param {boolean} value
 */
os.search.ISearch.prototype.setEnabled;


/**
 * Retrun true if this provider supports the search term.
 * @param {string} term The keyword to use in the search
 * @return {boolean}
 */
os.search.ISearch.prototype.supportsSearchTerm;


/**
 * Whether the search results should be normalized
 * @return {boolean}
 */
os.search.ISearch.prototype.shouldNormalize;


/**
 * Whether the search is sent to external search providers.
 * @return {boolean}
 */
os.search.ISearch.prototype.isExternal;


/**
 * Set if the search is external
 * @param {boolean} external
 */
os.search.ISearch.prototype.setExternal;


/**
 * Whether the search has gridded data
 * @return {boolean}
 */
os.search.ISearch.prototype.hasGridOptions;


/**
 * Set if the search has gridded data
 * @return {os.ui.draw.GridOptions}
 */
os.search.ISearch.prototype.getGridOptions;


/**
 * Set if the search has gridded data
 * @param {os.ui.draw.GridOptions} options
 */
os.search.ISearch.prototype.setGridOptions;
