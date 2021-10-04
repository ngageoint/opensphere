goog.declareModuleId('os.parse.AsyncParser');

import EventType from '../events/eventtype.js';

const GoogEvent = goog.require('goog.events.Event');
const EventTarget = goog.require('goog.events.EventTarget');

const {default: IParser} = goog.requireType('os.parse.IParser');


/**
 * A generic asynchronous parser. This should be used when setSource involves asynchronous calls. When the parser
 * is ready, call onReady to fire the ready event.
 *
 * @abstract
 * @implements {IParser<T>}
 * @template T
 */
export default class AsyncParser extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * Fires an error event to indicate initialization failed.
   *
   * @protected
   */
  onError() {
    this.dispatchEvent(new GoogEvent(EventType.ERROR));
  }

  /**
   * Fires a complete event to indicate the parser has been initialized and is ready to os.parse.
   *
   * @protected
   */
  onReady() {
    this.dispatchEvent(new GoogEvent(EventType.COMPLETE));
  }
}
