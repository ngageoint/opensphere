goog.module('os.search.FacetResults');
goog.module.declareLegacyNamespace();

const FacetResult = goog.requireType('os.search.FacetResult');


/**
 * @typedef {{
 *  category: string,
 *  data: Array<FacetResult>
 *  }}
 */
let FacetResults;

exports = FacetResults;
