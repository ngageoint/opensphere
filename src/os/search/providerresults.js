goog.declareModuleId('os.search.ProviderResults');

const {default: ISearchResult} = goog.requireType('os.search.ISearchResult');


/**
 * @typedef {{
 *   results: !Array<!ISearchResult>,
 *   total: number
 * }}
 */
let ProviderResults;

export default ProviderResults;
