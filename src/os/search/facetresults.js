goog.declareModuleId('os.search.FacetResults');

const {default: FacetResult} = goog.requireType('os.search.FacetResult');


/**
 * @typedef {{
 *  category: string,
 *  data: Array<FacetResult>
 *  }}
 */
let FacetResults;

export default FacetResults;
