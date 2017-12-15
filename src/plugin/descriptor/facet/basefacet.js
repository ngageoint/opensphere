goog.provide('plugin.descriptor.facet.BaseFacet');

goog.require('os.search.FacetSet');



/**
 * @constructor
 */
plugin.descriptor.facet.BaseFacet = function() {};


/**
 * Loads available facets from the descriptor
 * @param {!os.data.IDataDescriptor} descriptor
 * @param {!os.search.FacetSet} facets
 * @return {goog.Promise|undefined} undefined for synchronous or promise that resolves when the facet counts load
 */
plugin.descriptor.facet.BaseFacet.prototype.load = goog.abstractMethod;


/**
 * Tests applied facets against the descriptor
 * @param {!os.data.IDataDescriptor} descriptor
 * @param {os.search.AppliedFacets} facets
 * @param {Object<string, number>} results
 * @return {goog.Promise|undefined} undefined for synchronous or promise that resolves when the test finishes
 */
plugin.descriptor.facet.BaseFacet.prototype.test = goog.abstractMethod;


/**
 * @param {string} category
 * @return {boolean} Whether or not this facet can transform a value for the given category
 */
plugin.descriptor.facet.BaseFacet.prototype.transformsValue = function(category) {
  return false;
};


/**
 * @param {string} value
 * @return {string}
 */
plugin.descriptor.facet.BaseFacet.prototype.valueToLabel = function(value) {
  return value;
};


/**
 * @param {string} key
 * @param {string} value
 * @param {!os.search.FacetSet} facets
 */
plugin.descriptor.facet.BaseFacet.update = function(key, value, facets) {
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
plugin.descriptor.facet.BaseFacet.updateResults = function(key, results, opt_increment) {
  opt_increment = opt_increment || 0;

  if (!(key in results)) {
    results[key] = 0;
  }

  results[key] += opt_increment;
};
