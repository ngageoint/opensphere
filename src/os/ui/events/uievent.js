goog.provide('os.ui.events.UIEvent');
goog.provide('os.ui.events.UIEventParams');
goog.provide('os.ui.events.UIEventType');
goog.require('goog.events.Event');


/**
 * UI event types
 * @enum {string}
 */
os.ui.events.UIEventType = {
  TOGGLE_UI: 'toggleUI'
};


/**
 * Enum for keys used for {@code os.ui.events.UIEvent} params
 * @enum {string}
 */
os.ui.events.UIEventParams = {
  FILTER_FUNC: 'filterFunc',
  FILTER_NAME: 'filterName'
};



/**
 * UI event
 * @param {os.ui.events.UIEventType} type The event type
 * @param {string} id The UI identifier
 * @param {*=} opt_value The new UI value
 * @param {Object=} opt_params Optional parameters
 * @param {string=} opt_metricKey Optional metric key value
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.events.UIEvent = function(type, id, opt_value, opt_params, opt_metricKey) {
  os.ui.events.UIEvent.base(this, 'constructor', type);

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
};
goog.inherits(os.ui.events.UIEvent, goog.events.Event);
