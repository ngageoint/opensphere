goog.provide('os.search.IFacetedSearch');
goog.require('os.search.Facet');
goog.require('os.search.ISearch');


/**
 * @interface
 * @extends {os.search.ISearch}
 */
os.search.IFacetedSearch = function() {};


/**
 * See os.implements
 * @type {string}
 * @const
 */
os.search.IFacetedSearch.ID = 'os.search.IFacetedSearch';


/**
 * Loads the facets. Depending on the implementation, the results may be affected
 * by the applied facets.
 *
 * When facets are loaded, SearchEventType.FACETLOAD should be dispatched
 */
os.search.IFacetedSearch.prototype.loadFacets = goog.abstractMethod;


/**
 * @return {?os.search.FacetSet}
 */
os.search.IFacetedSearch.prototype.getFacets = goog.abstractMethod;


/**
 * Set the applied facets that will run with the next invocation of search()
 *
 * @param {os.search.AppliedFacets} facets The facets that have been enabled
 */
os.search.IFacetedSearch.prototype.applyFacets;


/**
 * Gets a label for a given category and value
 * @param {string} category
 * @param {string} value
 * @return {string} label
 */
os.search.IFacetedSearch.prototype.getLabel;

