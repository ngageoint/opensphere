goog.provide('os.ol.source.ILoadingSource');



/**
 * @interface
 */
os.ol.source.ILoadingSource = function() {};

/**
 * @type {string}
 * @const
 */
os.ol.source.ILoadingSource.ID = 'os.ol.source.ILoadingSource';

/**
 * If the source is currently in a loading state.
 * @return {boolean}
 */
os.ol.source.ILoadingSource.prototype.isLoading;


/**
 * Set if the source is in a loading state.
 * @param {boolean} value
 */
os.ol.source.ILoadingSource.prototype.setLoading;


/**
 * Decrement the loading count on the source.
 */
os.ol.source.ILoadingSource.prototype.decrementLoading;


/**
 * Increment the loading count on the source.
 */
os.ol.source.ILoadingSource.prototype.incrementLoading;
