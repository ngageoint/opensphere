goog.provide('os.search.ISearchResult');



/**
 * Interface representing a ranked search result. Results with higher rankings will appear first in search results.
 * @interface
 * @template T
 */
os.search.ISearchResult = function() {};


/**
 * The search result ID
 * @return {number|string}
 */
os.search.ISearchResult.prototype.getId;


/**
 * Get the search result.
 * @return {T}
 */
os.search.ISearchResult.prototype.getResult;


/**
 * Set the search result.
 * @param {T} value
 */
os.search.ISearchResult.prototype.setResult;


/**
 * Get the search result's score.
 * @return {number}
 */
os.search.ISearchResult.prototype.getScore;


/**
 * Set the search result's score.
 * @param {number} value
 */
os.search.ISearchResult.prototype.setScore;


/**
 * Get the interface used to render the search result.
 * @return {string}
 */
os.search.ISearchResult.prototype.getSearchUI;


/**
 * Set the interface used to render the search result.
 * @param {string} value
 */
os.search.ISearchResult.prototype.setSearchUI;


/**
 * Perform an application action for the result. Should return if action was taken, otherwise the result will be
 * displayed in the search results.
 * @return {boolean} If the action was performed.
 */
os.search.ISearchResult.prototype.performAction;
