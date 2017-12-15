goog.provide('os.events.Event');
goog.require('goog.events.Event');



/**
 * Simple event extension designed to carry anything as a payload.
 * @param {string} type
 * @param {*=} opt_data
 * @extends {goog.events.Event}
 * @constructor
 */
os.events.Event = function(type, opt_data) {
  os.events.Event.base(this, 'constructor', type);

  /**
   * Generic payload data.
   * @type {*}
   */
  this.data = opt_data;
};
goog.inherits(os.events.Event, goog.events.Event);


/**
 * Get the event data.
 * @return {*}
 */
os.events.Event.prototype.getData = function() {
  return this.data;
};


/**
 * Set the event data.
 * @param {*} value
 */
os.events.Event.prototype.setData = function(value) {
  this.data = value;
};
