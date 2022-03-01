goog.module('plugin.file.kml.tour.MockTourPrimitive');

const {default: AbstractTourPrimitive} = goog.require('plugin.file.kml.tour.AbstractTourPrimitive');


/**
 * Mock tour primitive.
 */
class MockTourPrimitive extends AbstractTourPrimitive {
  /**
   * Constructor.
   * @param {boolean=} opt_waitForResolve If the execute function should wait to resolve the promise.
   */
  constructor(opt_waitForResolve) {
    super();

    /**
     * How many times the pause function was called.
     * @type {number}
     */
    this.executedCount = 0;

    /**
     * How many times the pause function was called.
     * @type {number}
     */
    this.pausedCount = 0;

    /**
     * How many times the reset function was called.
     * @type {number}
     */
    this.resetCount = 0;

    /**
     * If the execute promise should wait to resolve. Saves the resolve function to `this.resolver`.
     * @type {boolean}
     */
    this.waitForResolve = opt_waitForResolve || false;

    /**
     * Promise resolve function.
     * @type {function()|undefined}
     */
    this.resolver = undefined;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.executedCount++;

    return new goog.Promise((resolve, reject) => {
      if (!this.waitForResolve) {
        resolve();
      } else {
        this.resolver = resolve;
      }
    });
  }

  /**
   * @inheritDoc
   */
  pause() {
    this.pausedCount++;
    this.resolver = undefined;
  }

  /**
   * @inheritDoc
   */
  reset() {
    this.resetCount++;
    this.resolver = undefined;
  }
}

exports = MockTourPrimitive;
