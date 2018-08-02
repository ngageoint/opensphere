goog.provide('os.search.AppliedFacets');
goog.provide('os.search.Facet');
goog.provide('os.search.FacetDefinition');
goog.provide('os.search.FacetSet');

/**
 * Key for number of facets missing in set due to query limits
 * @type {string}
 */
os.search.HiddenFacetCount = '_missingFacets';

/**
 * @typedef {{
 *  key: string,
 *  type: string,
 *  title: string
 *  }}
 */
os.search.FacetDefinition;

/**
 * @typedef {{
 *  title: string,
 *  enabled: boolean,
 *  count: number
 *  }}
 */
os.search.FacetResult;

/**
 * @typedef {{
 *  category: string,
 *  data: Array<os.search.FacetResult>
 *  }}
 */
os.search.FacetResults;


/**
 * @typedef {Object<string, Object<string, number>>}
 */
os.search.FacetSet;


/**
 * @typedef {Object<string, !Array<!string>>}
 */
os.search.AppliedFacets;
