goog.provide('os.events.LayerConfigEvent');
goog.provide('os.events.LayerConfigEventType');
goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.events.LayerConfigEventType = {
  CONFIGURE_AND_ADD: 'configureAndAddLayer'
};



/**
 * @param {string} type
 * @param {Object.<string, *>} options
 * @extends {goog.events.Event}
 * @constructor
 */
os.events.LayerConfigEvent = function(type, options) {
  os.events.LayerConfigEvent.base(this, 'constructor', type);

  /**
   * @type {Object.<string, *>|Array.<Object.<string, *>>}
   */
  this.options = options;
};
goog.inherits(os.events.LayerConfigEvent, goog.events.Event);
