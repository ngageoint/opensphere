goog.module('os.search.BaseFacet');

const Promise = goog.requireType('goog.Promise');
const AppliedFacets = goog.requireType('os.search.AppliedFacets');
const FacetSet = goog.requireType('os.search.FacetSet');


/**
 * Base implementation of a local search facet.
 * @abstract
 */
class BaseFacet {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * Loads available facets from the search item.
   *
   * @abstract
   * @param {T} item The search item.
   * @param {!FacetSet} facets
   * @return {Promise|undefined} undefined for synchronous or promise that resolves when the facet counts load
   * @template T
   */
  load(item, facets) {}

  /**
   * Tests applied facets against the search item.
   *
   * @abstract
   * @param {T} item The search item.
   * @param {AppliedFacets} facets
   * @param {Object<string, number>} results
   * @return {Promise|undefined} undefined for synchronous or promise that resolves when the test finishes
   * @template T
   */
  test(item, facets, results) {}

  /**
   * @param {string} category
   * @return {boolean} Whether or not this facet can transform a value for the given category
   */
  transformsValue(category) {
    return false;
  }

  /**
   * @param {string} value
   * @return {string}
   */
  valueToLabel(value) {
    return value;
  }

  /**
   * @param {string} key
   * @param {string} value
   * @param {!FacetSet} facets
   */
  static update(key, value, facets) {
    if (value) {
      if (!(key in facets)) {
        facets[key] = {};
      }

      if (!(value in facets[key])) {
        facets[key][value] = 0;
      }

      facets[key][value]++;
    }
  }

  /**
   * @param {string} key
   * @param {Object<string, number>} results
   * @param {number=} opt_increment
   */
  static updateResults(key, results, opt_increment) {
    opt_increment = opt_increment || 0;

    if (!(key in results)) {
      results[key] = 0;
    }

    results[key] += opt_increment;
  }
}

exports = BaseFacet;
