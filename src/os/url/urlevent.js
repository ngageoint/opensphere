goog.module('os.url.UrlEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const EventType = goog.require('os.url.EventType');


/**
 * Reference to the object that is the target of this event
 */
class UrlEvent extends GoogEvent {
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

exports = UrlEvent;
