goog.declareModuleId('os.data.event.DataEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: IFilter} = goog.requireType('os.filter.IFilter');
const {default: ISource} = goog.requireType('os.source.ISource');


/**
 * @template T
 */
export default class DataEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {ISource} source
   * @param {IFilter=} opt_filter
   * @param {Array.<T>=} opt_items
   */
  constructor(type, source, opt_filter, opt_items) {
    super(type);

    /**
     * @type {ISource}
     */
    this.source = source;

    /**
     * @type {?IFilter}
     */
    this.filter = opt_filter || null;

    /**
     * @type {?Array.<T>}
     */
    this.items = opt_items || null;
  }
}
