goog.module('os.thread.ThreadProgressEvent');

const GoogEvent = goog.require('goog.events.Event');
const EventType = goog.require('os.thread.EventType');


/**
 * A thread event
 */
class ThreadProgressEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {number} loaded
   * @param {number} total
   */
  constructor(loaded, total) {
    super(EventType.PROGRESS);

    /**
     * @type {number}
     * @private
     */
    this.loaded_ = loaded;

    /**
     * @type {number}
     * @private
     */
    this.total_ = total;
  }

  /**
   * @return {number} The number of items that have been processed
   */
  getLoaded() {
    return this.loaded_;
  }

  /**
   * @return {number} The number of items that will be processed
   */
  getTotal() {
    return this.total_;
  }
}

exports = ThreadProgressEvent;
