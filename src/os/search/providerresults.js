goog.module('os.search.ProviderResults');
goog.module.declareLegacyNamespace();

const ISearchResult = goog.requireType('os.search.ISearchResult');


/**
 * @typedef {{
 *   results: !Array<!ISearchResult>,
 *   total: number
 * }}
 */
let ProviderResults;

exports = ProviderResults;
