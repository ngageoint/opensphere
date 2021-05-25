goog.module('plugin.file.kml.tour.Wait');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const AbstractTourPrimitive = goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Holds the camera still for a specified amount of time.
 */
class Wait extends AbstractTourPrimitive {
  /**
   * Constructor.
   * @param {number} duration How long to wait, in milliseconds.
   */
  constructor(duration) {
    super();

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
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.isAsync) {
      // asynchronous primitives should run the timeout routine but resolve immediately
      this.executeWait();
      return Promise.resolve();
    } else {
      // synchronous primitives should resolve the promise after the timeout completes
      return new Promise(this.executeWait, this);
    }
  }

  /**
   * @inheritDoc
   */
  pause() {
    if (this.timeoutId_ !== undefined) {
      // cancel the timeout
      clearTimeout(this.timeoutId_);
      this.timeoutId_ = undefined;

      // save how much time is remaining to wait for the next execute call
      var elapsed = Date.now() - this.start_;
      var interval = this.getInterval();
      this.remaining_ = Math.max(interval - elapsed, 0);
    }
  }

  /**
   * @inheritDoc
   */
  reset() {
    // cancel the timeout (no-op if already completed)
    if (this.timeoutId_ !== undefined) {
      clearTimeout(this.timeoutId_);
      this.timeoutId_ = undefined;
    }

    // reset the wait status
    this.remaining_ = undefined;
    this.start_ = 0;
  }

  /**
   * Get the remaining time on the wait operation.
   *
   * @return {number} The remaining wait interval, in milliseconds.
   * @protected
   */
  getInterval() {
    return this.remaining_ !== undefined ? this.remaining_ : this.duration_;
  }

  /**
   * Handle wait completion.
   *
   * @param {function()=} opt_resolve The promise resolve function to call when done.
   * @param {function()=} opt_reject The promise reject function to call on failure.
   * @protected
   */
  executeWait(opt_resolve, opt_reject) {
    var interval = this.getInterval();
    if (interval > 0) {
      // start the timeout
      this.timeoutId_ = setTimeout(this.onWaitComplete.bind(this, opt_resolve, opt_reject), interval);
      this.start_ = Date.now();
    } else {
      // timeout duration 0 or already completed
      this.onWaitComplete(opt_resolve, opt_reject);
    }
  }

  /**
   * If the wait is currently active.
   *
   * @return {boolean}
   * @protected
   */
  isWaitActive() {
    return this.timeoutId_ !== undefined;
  }

  /**
   * Handle wait completion.
   *
   * @param {function()=} opt_resolve The promise resolve function to call when done.
   * @param {function()=} opt_reject The promise reject function to call on failure.
   * @protected
   */
  onWaitComplete(opt_resolve, opt_reject) {
    // reset everything and resolve the promise
    this.reset();

    if (opt_resolve) {
      opt_resolve();
    }
  }
}

exports = Wait;
