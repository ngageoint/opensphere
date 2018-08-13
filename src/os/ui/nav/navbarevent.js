goog.provide('os.ui.nav.EventType');
goog.provide('os.ui.nav.NavBarEvent');

goog.require('goog.events.Event');


/**
 * Events for the nav bar
 * @enum {string}
 */
os.ui.nav.EventType = {
  RESIZE: 'os.ui.nav.resize'
};



/**
 * @param {string} type The event type
 * @param {boolean} state
 *
 * @extends {goog.events.Event}
 * @constructor
 */
os.ui.nav.NavBarEvent = function(type, state) {
  os.ui.nav.NavBarEvent.base(this, 'constructor', type);

  /**
   * The status of this event
   * @type {boolean}
   */
  this.state = state;
};
goog.inherits(os.ui.nav.NavBarEvent, goog.events.Event);
