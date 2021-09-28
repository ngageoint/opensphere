goog.declareModuleId('os.url.UrlEvent');

import EventType from './eventtype.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * Reference to the object that is the target of this event
 */
export default class UrlEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {Object} params The parameters for the url import
   * @param {Object=} opt_target
   */
  constructor(params, opt_target) {
    super(EventType.URL_IMPORTED, opt_target);

    /**
     * @private
     * @type {Object}
     */
    this.params_ = params;
  }

  /**
   * @return {Object}
   */
  getParams() {
    return this.params_;
  }
}
