goog.provide('os.thread.ThreadProgressEvent');
goog.require('goog.events.Event');
goog.require('os.thread.EventType');



/**
 * A thread event
 * @param {number} loaded
 * @param {number} total
 * @extends {goog.events.Event}
 * @constructor
 */
os.thread.ThreadProgressEvent = function(loaded, total) {
  os.thread.ThreadProgressEvent.base(this, 'constructor', os.thread.EventType.PROGRESS);

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
};
goog.inherits(os.thread.ThreadProgressEvent, goog.events.Event);


/**
 * @return {number} The number of items that have been processed
 */
os.thread.ThreadProgressEvent.prototype.getLoaded = function() {
  return this.loaded_;
};


/**
 * @return {number} The number of items that will be processed
 */
os.thread.ThreadProgressEvent.prototype.getTotal = function() {
  return this.total_;
};
