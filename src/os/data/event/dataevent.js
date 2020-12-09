goog.module('os.data.event.DataEvent');
goog.module.declareLegacyNamespace();

const Event = goog.require('goog.events.Event');

goog.requireType('os.filter.IFilter');


goog.requireType('os.source.ISource');


/**
 * @template T
 */
class DataEvent extends Event {
  /**
   * Constructor.
   * @param {string} type
   * @param {os.source.ISource} source
   * @param {os.filter.IFilter=} opt_filter
   * @param {Array.<T>=} opt_items
   */
  constructor(type, source, opt_filter, opt_items) {
    super(type);

    /**
     * @type {os.source.ISource}
     */
    this.source = source;

    /**
     * @type {?os.filter.IFilter}
     */
    this.filter = opt_filter || null;

    /**
     * @type {?Array.<T>}
     */
    this.items = opt_items || null;
  }
}

exports = DataEvent;
