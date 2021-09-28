goog.declareModuleId('os.data.DataProviderEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: IDataProvider} = goog.requireType('os.data.IDataProvider');


/**
 */
export default class DataProviderEvent extends GoogEvent {
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
