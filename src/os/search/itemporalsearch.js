goog.provide('os.search.ITemporalSearch');


/**
 * Interface for a search provider that supports filtering by date range.
 * @interface
 */
os.search.ITemporalSearch = function() {};


/**
 * See os.implements
 * @type {string}
 * @const
 */
os.search.ITemporalSearch.ID = 'os.search.ITemporalSearch';


/**
 * Set the date range to apply to the query
 * @param {Date|null|undefined} startDate The start date to apply to the query.
 * @param {Date|null|undefined} endDate The end date to apply to the query.
 */
os.search.ITemporalSearch.prototype.setDateRange;


/**
 * Set the start date to apply to the query.
 * @param {Date|null|undefined} startDate The start date to apply to the query.
 */
os.search.ITemporalSearch.prototype.setStartDate;


/**
 * Set the end date to apply to the query.
 * @param {Date|null|undefined} startDate The start date to apply to the query.
 */
os.search.ITemporalSearch.prototype.setEndDate;


/**
 * If the search provider supports filtering searches by a date range.
 * @return {boolean}
 */
os.search.ITemporalSearch.prototype.supportsDateRange;


/**
 * If the search provider supports filtering searches by start date.
 * @return {boolean}
 */
os.search.ITemporalSearch.prototype.supportsStartDate;


/**
 * If the search provider supports filtering searches by end date.
 * @return {boolean}
 */
os.search.ITemporalSearch.prototype.supportsEndDate;
