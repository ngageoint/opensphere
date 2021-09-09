goog.module('os.net.RequestEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 */
class RequestEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {!string} type
   * @param {!string} url
   */
  constructor(type, url) {
    super(type);

    /**
     * @type {!string}
     */
    this.url = url;
  }
}

exports = RequestEvent;
