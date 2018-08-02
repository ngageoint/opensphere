goog.provide('plugin.file.kml.tour.Wait');

goog.require('goog.Promise');
goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Holds the camera still for a specified amount of time.
 * @param {number} duration How long to wait, in milliseconds.
 * @extends {plugin.file.kml.tour.AbstractTourPrimitive}
 * @constructor
 */
plugin.file.kml.tour.Wait = function(duration) {
  plugin.file.kml.tour.Wait.base(this, 'constructor');

  /**
   * The wait duration, in milliseconds.
   * @type {number}
   * @private
   */
  this.duration_ = Math.max(duration, 0);

  /**
   * Remaining duration on the wait.
   * @type {number|undefined}
   * @private
   */
  this.remaining_ = undefined;

  /**
   * The last time the wait was started.
   * @type {number}
   * @private
   */
  this.start_ = 0;

  /**
   * The active timeout id.
   * @type {number|undefined}
   * @private
   */
  this.timeoutId_ = undefined;
};
goog.inherits(plugin.file.kml.tour.Wait, plugin.file.kml.tour.AbstractTourPrimitive);


/**
 * @inheritDoc
 */
plugin.file.kml.tour.Wait.prototype.execute = function() {
  if (this.isAsync) {
    // asynchronous primitives should run the timeout routine but resolve immediately
    this.executeWait();
    return goog.Promise.resolve();
  } else {
    // synchronous primitives should resolve the promise after the timeout completes
    return new goog.Promise(this.executeWait, this);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.Wait.prototype.pause = function() {
  if (this.timeoutId_ !== undefined) {
    // cancel the timeout
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = undefined;

    // save how much time is remaining to wait for the next execute call
    var elapsed = Date.now() - this.start_;
    var interval = this.getInterval();
    this.remaining_ = Math.max(interval - elapsed, 0);
  }
};


/**
 * @inheritDoc
 */
plugin.file.kml.tour.Wait.prototype.reset = function() {
  // cancel the timeout (no-op if already completed)
  if (this.timeoutId_ !== undefined) {
    clearTimeout(this.timeoutId_);
    this.timeoutId_ = undefined;
  }

  // reset the wait status
  this.remaining_ = undefined;
  this.start_ = 0;
};


/**
 * Get the remaining time on the wait operation.
 * @return {number} The remaining wait interval, in milliseconds.
 * @protected
 */
plugin.file.kml.tour.Wait.prototype.getInterval = function() {
  return this.remaining_ !== undefined ? this.remaining_ : this.duration_;
};


/**
 * Handle wait completion.
 * @param {function()=} opt_resolve The promise resolve function to call when done.
 * @param {function()=} opt_reject The promise reject function to call on failure.
 * @protected
 */
plugin.file.kml.tour.Wait.prototype.executeWait = function(opt_resolve, opt_reject) {
  var interval = this.getInterval();
  if (interval > 0) {
    // start the timeout
    this.timeoutId_ = setTimeout(this.onWaitComplete.bind(this, opt_resolve, opt_reject), interval);
    this.start_ = Date.now();
  } else {
    // timeout duration 0 or already completed
    this.onWaitComplete(opt_resolve, opt_reject);
  }
};


/**
 * If the wait is currently active.
 * @return {boolean}
 * @protected
 */
plugin.file.kml.tour.Wait.prototype.isWaitActive = function() {
  return this.timeoutId_ !== undefined;
};


/**
 * Handle wait completion.
 * @param {function()=} opt_resolve The promise resolve function to call when done.
 * @param {function()=} opt_reject The promise reject function to call on failure.
 * @protected
 */
plugin.file.kml.tour.Wait.prototype.onWaitComplete = function(opt_resolve, opt_reject) {
  // reset everything and resolve the promise
  this.reset();

  if (opt_resolve) {
    opt_resolve();
  }
};
