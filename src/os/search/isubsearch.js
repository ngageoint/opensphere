goog.module('os.search.ISubSearch');
goog.module.declareLegacyNamespace();

const SearchFacetDepartment = goog.requireType('os.search.SearchFacetDepartment');
const TriState = goog.requireType('os.structs.TriState');


/**
 * Supports having sub searches under a single provider
 * @interface
 */
class ISubSearch {
  /**
   * @return {Array<!Array<string>>}
   */
  getRegisteredSubSearches() {}

  /**
   * @param {SearchFacetDepartment=} opt_searchFacetDepartment
   * @return {TriState}
   */
  isSubSearchEnabled(opt_searchFacetDepartment) {}

  /**
   * @param {Array<!Array<string>>} enabled
   */
  setEnabledSubSearches(enabled) {}

  /**
   * @param {SearchFacetDepartment} searchFacetDepartment
   * @return {boolean}
   */
  isSubSearch(searchFacetDepartment) {}

  /**
   * @return {Array<!Array<string>>}
   */
  getEnabledSubSearches() {}

  /**
   * @return {!Array<!Array<string>>}
   */
  getDefaultDisabledSubSearches() {}

  /**
   * @return {boolean}
   */
  isSubSearchCapabilityEnabled() {}
}


/**
 * See os.implements
 * @type {string}
 * @const
 */
ISubSearch.ID = 'os.search.ISubSearch';


exports = ISubSearch;
