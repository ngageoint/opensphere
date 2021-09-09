goog.module('os.data.DataProviderEventType');

/**
 * @enum {string}
 */
exports = {
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
