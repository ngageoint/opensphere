goog.declareModuleId('os.ui.IScrollDataSource');

const {default: SearchManager} = goog.requireType('os.search.SearchManager');


/**
 * Interface for data sources which will feed angular-ui ng-scroll directive
 *
 * @interface
 */
export default class IScrollDataSource {
  /**
   * Set the data source from which to retrieve records
   * @param {SearchManager} dataSource
   */
  setDataSource(dataSource) {}

  /**
   * Called by ng-scroll directive to retrieve more data.  Executes callback when
   * results have been retrieved, and passes in the results to append.
   * @param {number} index Start index for retrieving results
   * @param {number} count Number of results to retrieve
   * @param {Function} onSuccess Callback for providing results to client
   */
  getData(index, count, onSuccess) {}

  /**
   * Force an update on the data source, indicating elements have changed
   */
  update() {}

  /**
   * Used by ng-scroll directive to know when the model has been updated.
   * @return {number}
   */
  getRevision() {}

  /**
   * Indicate whether or not a request is pending.
   * @return {boolean}
   */
  isLoading() {}
}
