goog.declareModuleId('os.events.Event');

const GoogEvent = goog.require('goog.events.Event');


/**
 * Simple event extension designed to carry anything as a payload.
 */
export default class Event extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type
   * @param {*=} opt_data
   */
  constructor(type, opt_data) {
    super(type);

    /**
     * Generic payload data.
     * @type {*}
     */
    this.data = opt_data;
  }

  /**
   * Get the event data.
   *
   * @return {*}
   */
  getData() {
    return this.data;
  }

  /**
   * Set the event data.
   *
   * @param {*} value
   */
  setData(value) {
    this.data = value;
  }
}
