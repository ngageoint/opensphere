goog.provide('os.ui.IScrollDataSource');



/**
 * Interface for data sources which will feed angular-ui ng-scroll directive
 * @interface
 */
os.ui.IScrollDataSource = function() {};


/**
 * Set the data source from which to retrieve records
 * @param {os.search.SearchManager} dataSource
 */
os.ui.IScrollDataSource.prototype.setDataSource;


/**
 * Called by ng-scroll directive to retrieve more data.  Executes callback when
 * results have been retrieved, and passes in the results to append.
 * @param {number} index Start index for retrieving results
 * @param {number} count Number of results to retrieve
 * @param {Function} onSuccess Callback for providing results to client
 */
os.ui.IScrollDataSource.prototype.getData;


/**
 * Force an update on the data source, indicating elements have changed
 */
os.ui.IScrollDataSource.prototype.update;


/**
 * Used by ng-scroll directive to know when the model has been updated.
 * @return {number}
 */
os.ui.IScrollDataSource.prototype.getRevision;


/**
 * Indicate whether or not a request is pending.
 * @return {boolean}
 */
os.ui.IScrollDataSource.prototype.isLoading;
