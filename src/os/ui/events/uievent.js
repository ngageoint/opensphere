goog.module('os.ui.events.UIEvent');
goog.module.declareLegacyNamespace();

const Event = goog.require('goog.events.Event');


/**
 * UI event
 */
class UIEvent extends Event {
  /**
   * Constructor.
   * @param {os.ui.events.UIEventType} type The event type
   * @param {string} id The UI identifier
   * @param {*=} opt_value The new UI value
   * @param {Object=} opt_params Optional parameters
   * @param {string=} opt_metricKey Optional metric key value
   */
  constructor(type, id, opt_value, opt_params, opt_metricKey) {
    super(type);

    /**
     * The UI identifier
     * @type {string}
     */
    this.id = id;

    /**
     * The new UI value
     * @type {*}
     */
    this.value = opt_value;

    /**
     * Optional parameters
     * @type {Object}
     */
    this.params = opt_params || null;

    /**
     * Optional metric key value
     * @type {?string}
     */
    this.metricKey = opt_metricKey || null;
  }
}

exports = UIEvent;
