goog.declareModuleId('os.search.ISearchResult');

/**
 * Interface representing a ranked search result. Results with higher rankings will appear first in search results.
 *
 * @interface
 * @template T
 */
export default class ISearchResult {
  /**
   * The search result ID
   * @return {number|string}
   */
  getId() {}

  /**
   * Get the search result.
   * @return {T}
   */
  getResult() {}

  /**
   * Set the search result.
   * @param {T} value
   */
  setResult(value) {}

  /**
   * Get the search result's score.
   * @return {number}
   */
  getScore() {}

  /**
   * Set the search result's score.
   * @param {number} value
   */
  setScore(value) {}

  /**
   * Get the interface used to render the search result.
   * @return {string}
   */
  getSearchUI() {}

  /**
   * Perform an application action for the result. Should return if action was taken, otherwise the result will be
   * displayed in the search results.
   * @return {boolean} If the action was performed.
   */
  performAction() {}
}
