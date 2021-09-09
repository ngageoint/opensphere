goog.declareModuleId('os.query.MockHandler');

/**
 * Mock query handler
 * @param {string} id
 * @constructor
 */
export class MockHandler {
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
