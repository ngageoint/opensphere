goog.declareModuleId('os.ui.filter.FilterEvent');

const GoogEvent = goog.require('goog.events.Event');

const FilterEntry = goog.requireType('os.filter.FilterEntry');


/**
 */
export default class FilterEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {string=} opt_key
   * @param {FilterEntry=} opt_entry
   */
  constructor(type, opt_key, opt_entry) {
    super(type);

    /**
     * @type {?string}
     */
    this.key = opt_key || null;

    /**
     * @type {FilterEntry}
     */
    this.entry = opt_entry || null;
  }
}
