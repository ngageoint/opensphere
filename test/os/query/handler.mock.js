goog.module('os.query.Handler');

/**
 * Mock query handler
 * @param {string} id
 * @constructor
 */
class Handler {
  /**
   * Constructor.
   * @param {string} id
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * @return {?}
   */
  getLayerId() {
    return this.id;
  }

  /**
   * @return {?}
   */
  getLayerName() {
    return this.id;
  }
}

exports = Handler;
