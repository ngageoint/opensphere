goog.module('os.search.ISearch');

const Listenable = goog.requireType('goog.events.Listenable');


/**
 *  The base interface for executing a search.
 *
 *  @extends {Listenable}
 *  @interface
 */
class ISearch {
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
  search(term, opt_start, opt_pageSize, opt_sortBy, opt_noFacets, opt_sortOrder) {}

  /**
   * Cancels any pending requests
   */
  cancel() {}

  /**
   * Requests autocomplete results from a search term.
   * @param {string} term The keyword to use in the search
   * @param {number=} opt_maxResults The maximum number of autocomplete results.
   *   Defaults to an appropriate value.
   */
  autocomplete(term, opt_maxResults) {}

  /**
   * Retrieve the unique identifier for the search.
   * @return {string}
   */
  getId() {}

  /**
   * Retrieve the user-facing name for the search.
   * @return {string}
   */
  getName() {}

  /**
   * Retrieve the search type for choosing search priority.
   * @return {string}
   */
  getType() {}

  /**
   * Retrieve the priority for this search with respect to others of the same type.
   * @return {number}
   */
  getPriority() {}

  /**
   * If the search is enabled.
   * @return {boolean}
   */
  isEnabled() {}

  /**
   * Set if the search is enabled.
   * @param {boolean} value
   */
  setEnabled(value) {}

  /**
   * Retrun true if this provider supports the search term.
   * @param {string} term The keyword to use in the search
   * @return {boolean}
   */
  supportsSearchTerm(term) {}

  /**
   * Whether the search results should be normalized
   * @return {boolean}
   */
  shouldNormalize() {}

  /**
   * Whether the search is sent to external search providers.
   * @return {boolean}
   */
  isExternal() {}

  /**
   * Set if the search is external
   * @param {boolean} external
   */
  setExternal(external) {}
}

exports = ISearch;
