goog.declareModuleId('os.search.ITemporalSearch');

/**
 * Interface for a search provider that supports filtering by date range.
 *
 * @interface
 */
export default class ITemporalSearch {
  /**
   * Set the date range to apply to the query
   * @param {Date|null|undefined} startDate The start date to apply to the query.
   * @param {Date|null|undefined} endDate The end date to apply to the query.
   */
  setDateRange(startDate, endDate) {}

  /**
   * Set the start date to apply to the query.
   * @param {Date|null|undefined} startDate The start date to apply to the query.
   */
  setStartDate(startDate) {}

  /**
   * Set the end date to apply to the query.
   * @param {Date|null|undefined} startDate The start date to apply to the query.
   */
  setEndDate(startDate) {}

  /**
   * If the search provider supports filtering searches by a date range.
   * @return {boolean}
   */
  supportsDateRange() {}

  /**
   * If the search provider supports filtering searches by start date.
   * @return {boolean}
   */
  supportsStartDate() {}

  /**
   * If the search provider supports filtering searches by end date.
   * @return {boolean}
   */
  supportsEndDate() {}
}

/**
 * See os.implements
 * @type {string}
 * @const
 */
ITemporalSearch.ID = 'os.search.ITemporalSearch';
