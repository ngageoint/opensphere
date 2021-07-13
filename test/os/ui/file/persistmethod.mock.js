goog.module('os.ui.file.MockPersistMethod');
goog.module.declareLegacyNamespace();

/**
 * Mock persistence method for unit tests.
 */
class MockPersistMethod {
  /**
   * Constructor.
   */
  constructor() {
    this.reqUserAction = true;
    this.supported = true;
  }

  /**
   * The human-readable label for this persistence method.
   * @return {string}
   */
  getLabel() {
    return MockPersistMethod.LABEL;
  }

  /**
   * Whether or not the method is supported
   * @return {boolean}
   */
  isSupported() {
    return this.supported;
  }

  /**
   * Whether the persistence method requires a user action in the call stack
   * @return {boolean}
   */
  requiresUserAction() {
    return this.reqUserAction;
  }

  /**
   * Saves the given content
   * @param {string} fileName The file name (may not be applicable to all persistence methods)
   * @param {*} content The content to save
   * @param {string=} opt_mimeType The mime type of the content
   * @return {boolean} Whether or not the save action was successfull
   */
  save(fileName, content, opt_mimeType) {
    return true;
  }

  /**
   * Reset to the default state.
   */
  reset() {
    this.reqUserAction = true;
    this.supported = true;
  }
}

/**
 * @type {string}
 * @const
 */
MockPersistMethod.LABEL = 'Mock Persistence';

exports = MockPersistMethod;
