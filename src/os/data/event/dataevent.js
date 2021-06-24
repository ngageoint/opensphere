goog.module('os.data.event.DataEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');

const IFilter = goog.requireType('os.filter.IFilter');
const ISource = goog.requireType('os.source.ISource');

/**
 * @template T
 */
class DataEvent extends GoogEvent {
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

exports = DataEvent;
