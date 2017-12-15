goog.provide('os.data.ILoadingProvider');

goog.require('os.data.IDataProvider');



/**
 * Data provider with a loading state.
 * @interface
 * @extends {os.data.IDataProvider}
 */
os.data.ILoadingProvider = function() {};


/**
 * If the provider is currently in a loading state.
 * @return {boolean}
 */
os.data.ILoadingProvider.prototype.isLoading;


/**
 * Set if the provider is in a loading state.
 * @param {boolean} value
 */
os.data.ILoadingProvider.prototype.setLoading;
