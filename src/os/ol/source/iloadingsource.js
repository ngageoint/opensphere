goog.declareModuleId('os.ol.source.ILoadingSource');

/**
 * @interface
 */
export default class ILoadingSource {
  /**
   * If the source is currently in a loading state.
   * @return {boolean}
   */
  isLoading() {}

  /**
   * Set if the source is in a loading state.
   * @param {boolean} value
   */
  setLoading(value) {}

  /**
   * Decrement the loading count on the source.
   */
  decrementLoading() {}

  /**
   * Increment the loading count on the source.
   */
  incrementLoading() {}
}

/**
 * @type {string}
 * @const
 */
ILoadingSource.ID = 'os.ol.source.ILoadingSource';
