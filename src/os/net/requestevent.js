goog.declareModuleId('os.net.RequestEvent');

const GoogEvent = goog.require('goog.events.Event');


/**
 */
export default class RequestEvent extends GoogEvent {
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
