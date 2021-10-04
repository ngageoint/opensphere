goog.declareModuleId('os.search.IFacetedSearch');

const {default: AppliedFacets} = goog.requireType('os.search.AppliedFacets');
const {default: FacetSet} = goog.requireType('os.search.FacetSet');
const {default: ISearch} = goog.requireType('os.search.ISearch');


/**
 * @interface
 * @extends {ISearch}
 */
export default class IFacetedSearch {
  /**
   * Loads the facets. Depending on the implementation, the results may be affected
   * by the applied facets.
   *
   * When facets are loaded, SearchEventType.FACETLOAD should be dispatched
   */
  loadFacets() {}

  /**
   * @return {?FacetSet}
   */
  getFacets() {}

  /**
   * Set the applied facets that will run with the next invocation of search()
   *
   * @param {AppliedFacets} facets The facets that have been enabled
   */
  applyFacets(facets) {}

  /**
   * Gets a label for a given category and value
   * @param {string} category
   * @param {string} value
   * @return {string} label
   */
  getLabel(category, value) {}
}

/**
 * See os.implements
 * @type {string}
 * @const
 */
IFacetedSearch.ID = 'os.search.IFacetedSearch';
