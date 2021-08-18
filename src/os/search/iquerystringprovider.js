goog.module('os.search.IQueryStringProvider');
goog.module.declareLegacyNamespace();


/**
 *  The base interface for query providers
 *
 *  @interface
 */
class IQueryStringProvider {
  /**
   * Retruns a query sting
   * @return {string}
   */
  toQueryString() {}
}

exports = IQueryStringProvider;
