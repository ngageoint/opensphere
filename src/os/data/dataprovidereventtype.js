goog.declareModuleId('os.data.DataProviderEventType');

/**
 * @enum {string}
 */
const DataProviderEventType = {
  ADD_PROVIDER: 'addDataProvider',
  REMOVE_PROVIDER: 'removeDataProvider',
  EDIT_PROVIDER: 'editDataProvider',
  MANAGE_PROVIDERS: 'manageDataProviders',
  CHECK_PROVIDERS: 'checkDataProviders',
  PROVIDERS_CONFIGURED: 'providersConfigured',
  LOADING: 'dataProviderLoading',
  LOADED: 'dataProviderLoaded',
  ERROR: 'dataProviderError'
};

export default DataProviderEventType;
