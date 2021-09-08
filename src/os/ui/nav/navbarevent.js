goog.module('os.ui.nav.NavBarEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 */
class NavBarEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {string} type The event type
   * @param {boolean} state
   */
  constructor(type, state) {
    super(type);

    /**
     * The status of this event
     * @type {boolean}
     */
    this.state = state;
  }
}

exports = NavBarEvent;
