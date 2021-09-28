goog.declareModuleId('os.thread.ThreadProgressEvent');

import EventType from './eventtype.js';

const GoogEvent = goog.require('goog.events.Event');


/**
 * A thread event
 */
export default class ThreadProgressEvent extends GoogEvent {
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
