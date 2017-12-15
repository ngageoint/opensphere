goog.provide('os.data.DataProviderEvent');
goog.provide('os.data.DataProviderEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.data.DataProviderEventType = {
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



/**
 * @param {string} type
 * @param {os.data.IDataProvider=} opt_dataProvider
 * @param {string=} opt_providerType
 * @param {string=} opt_message
 * @extends {goog.events.Event}
 * @constructor
 */
os.data.DataProviderEvent = function(type, opt_dataProvider, opt_providerType, opt_message) {
  os.data.DataProviderEvent.base(this, 'constructor', type);

  /**
   * @type {?os.data.IDataProvider}
   */
  this.dataProvider = opt_dataProvider || null;

  /**
   * @type {?string}
   */
  this.providerType = opt_providerType || null;

  /**
   * @type {?string}
   */
  this.message = opt_message || null;
};
goog.inherits(os.data.DataProviderEvent, goog.events.Event);
