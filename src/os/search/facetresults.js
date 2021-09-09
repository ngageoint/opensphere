goog.module('os.search.FacetResults');

const FacetResult = goog.requireType('os.search.FacetResult');


/**
 * @typedef {{
 *  category: string,
 *  data: Array<FacetResult>
 *  }}
 */
let FacetResults;

exports = FacetResults;
