goog.declareModuleId('os.xt.MockHandler');

/**
 * @constructor
 */
export class MockHandler {
  /**
   * Constructor.
   */
  constructor() {}

  /**
   * @return {Array<!string>}
   */
  getTypes() {
    return ['test'];
  }

  /**
   * @param {*} data
   */
  process(data) {
    value += data;
  }

  /**
   * @return {number}
   */
  static get value() {
    return value;
  }

  /**
   * @param {number} v
   */
  static set value(v) {
    value = v;
  }
}

/**
 * @type {number}
 */
let value = 0;
