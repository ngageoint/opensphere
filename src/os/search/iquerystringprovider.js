goog.declareModuleId('os.search.IQueryStringProvider');

/**
 *  The base interface for query providers
 *
 *  @interface
 */
export default class IQueryStringProvider {
  /**
   * Retruns a query sting
   * @return {string}
   */
  toQueryString() {}
}
