goog.module('os.data.DataProviderEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const IDataProvider = goog.requireType('os.data.IDataProvider');


/**
 */
class DataProviderEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {IDataProvider=} opt_dataProvider
   * @param {string=} opt_providerType
   * @param {string=} opt_message
   */
  constructor(type, opt_dataProvider, opt_providerType, opt_message) {
    super(type);

    /**
     * @type {?IDataProvider}
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
  }
}

exports = DataProviderEvent;
