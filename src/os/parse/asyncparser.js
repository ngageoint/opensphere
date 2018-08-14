goog.provide('os.parse.AsyncParser');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.parse.IParser');



/**
 * A generic asynchronous parser. This should be used when setSource involves asynchronous calls. When the parser
 * is ready, call onReady to fire the ready event.
 * @extends {goog.events.EventTarget}
 * @implements {os.parse.IParser<T>}
 * @constructor
 * @template T
 */
os.parse.AsyncParser = function() {
  os.parse.AsyncParser.base(this, 'constructor');
};
goog.inherits(os.parse.AsyncParser, goog.events.EventTarget);


/**
 * Fires an error event to indicate initialization failed.
 * @protected
 */
os.parse.AsyncParser.prototype.onError = function() {
  this.dispatchEvent(new goog.events.Event(os.events.EventType.ERROR));
};


/**
 * Fires a complete event to indicate the parser has been initialized and is ready to os.parse.
 * @protected
 */
os.parse.AsyncParser.prototype.onReady = function() {
  this.dispatchEvent(new goog.events.Event(os.events.EventType.COMPLETE));
};


/**
 * @inheritDoc
 */
os.parse.AsyncParser.prototype.hasNext = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.parse.AsyncParser.prototype.parseNext = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.parse.AsyncParser.prototype.setSource = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.parse.AsyncParser.prototype.cleanup = goog.abstractMethod;
