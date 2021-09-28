goog.declareModuleId('os.data.ILoadingProvider');

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 * Data provider with a loading state.
 *
 * @interface
 * @extends {IDataProvider}
 */
export default class ILoadingProvider {
  /**
   * If the provider is currently in a loading state.
   * @return {boolean}
   */
  isLoading() {}

  /**
   * Set if the provider is in a loading state.
   * @param {boolean} value
   */
  setLoading(value) {}
}


/**
 * ID for {@see os.implements}
 * @const {string}
 */
ILoadingProvider.ID = 'os.data.ILoadingProvider';
