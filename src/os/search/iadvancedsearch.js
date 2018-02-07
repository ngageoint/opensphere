goog.provide('os.search.IAdvancedSearch');
goog.require('goog.events.Listenable');
goog.require('os.search.ISearch');



/**
 *  The base interface for executing advanced search.
 *  @extends {os.search.ISearch}
 *  @interface
 */
os.search.IAdvancedSearch = function() {};


/**
 * See os.implements
 * @type {string}
 * @const
 */
os.search.IAdvancedSearch.ID = 'os.search.IAdvancedSearch';


/**
 * Load the options for this category
 * @param {string} title
 * @param {string} filter
 */
os.search.IAdvancedSearch.prototype.loadAdvOptions;


/**
 * @return {Array<os.search.FacetDefinition>}
 */
os.search.IAdvancedSearch.prototype.getAvailableAdvDefinitions;


/**
 * @return {core.search.Expression}
 */
os.search.IAdvancedSearch.prototype.getAppliedAdv;


/**
 * Loads and presisists all the possible options for advanced dropdowns
 */
os.search.IAdvancedSearch.prototype.requestAdvDefinition;


/**
 * Apply the advanced query
 * @param {core.search.Expression} adv
 */
os.search.IAdvancedSearch.prototype.applyAdv;
