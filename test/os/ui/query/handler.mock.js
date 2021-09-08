goog.module('os.ui.query.MockHandler');

/**
 * Mock handler.
 * @param {string} id
 * @constructor
 */
class MockHandler {
  /**
   * @param {string} id
   */
  constructor(id) {
    this.id = id;
  }

  /**
   * @return {string}
   */
  getLayerId() {
    return this.id;
  }

  /**
   * @return {string}
   */
  getLayerName() {
    return this.id;
  }
}

exports = MockHandler;
