goog.module('os.net.MockModifier');

/**
 * Simple modifier implementation.
 */
class MockModifier {
  /**
   * Constructor.
   */
  constructor() {
    this.id_ = 'mock1';
    this.priority_ = 1;
  }

  /**
   * @return {string}
   */
  getId() {
    return this.id_;
  }

  /**
   * @param {string} id
   */
  setId(id) {
    this.id_ = id;
  }

  /**
   * @return {number}
   */
  getPriority() {
    return this.priority_;
  }

  /**
   * @param {number} p
   */
  setPriority(p) {
    this.priority_ = p;
  }

  /**
   * @param {string} uri
   */
  modify(uri) {
    uri.setParameterValue(this.getId(), this.getPriority());
  }
}

exports = MockModifier;
