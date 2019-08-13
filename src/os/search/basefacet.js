goog.provide('os.search.BaseFacet');

goog.require('os.search.FacetSet');



/**
 * Base implementation of a local search facet.
 * @abstract
 * @constructor
 */
os.search.BaseFacet = function() {};


/**
 * Loads available facets from the search item.
 *
 * @abstract
 * @param {T} item The search item.
 * @param {!os.search.FacetSet} facets
 * @return {goog.Promise|undefined} undefined for synchronous or promise that resolves when the facet counts load
 * @template T
 */
os.search.BaseFacet.prototype.load = function(item, facets) {};


/**
 * Tests applied facets against the search item.
 *
 * @abstract
 * @param {T} item The search item.
 * @param {os.search.AppliedFacets} facets
 * @param {Object<string, number>} results
 * @return {goog.Promise|undefined} undefined for synchronous or promise that resolves when the test finishes
 * @template T
 */
os.search.BaseFacet.prototype.test = function(item, facets, results) {};


/**
 * @param {string} category
 * @return {boolean} Whether or not this facet can transform a value for the given category
 */
os.search.BaseFacet.prototype.transformsValue = function(category) {
  return false;
};


/**
 * @param {string} value
 * @return {string}
 */
os.search.BaseFacet.prototype.valueToLabel = function(value) {
  return value;
};


/**
 * @param {string} key
 * @param {string} value
 * @param {!os.search.FacetSet} facets
 */
os.search.BaseFacet.update = function(key, value, facets) {
  if (value) {
    if (!(key in facets)) {
      facets[key] = {};
    }

    if (!(value in facets[key])) {
      facets[key][value] = 0;
    }

    facets[key][value]++;
  }
};


/**
 * @param {string} key
 * @param {Object<string, number>} results
 * @param {number=} opt_increment
 */
os.search.BaseFacet.updateResults = function(key, results, opt_increment) {
  opt_increment = opt_increment || 0;

  if (!(key in results)) {
    results[key] = 0;
  }

  results[key] += opt_increment;
};
