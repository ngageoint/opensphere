goog.module('os.data.MockProvider');

const {default: BaseProvider} = goog.require('os.ui.data.BaseProvider');


/**
 * Mock provider for tests.
 */
class MockProvider extends BaseProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @param {Object} config Test config.
   */
  configure(config) {
    this.test = config['test'];
  }

  /**
   * @param {boolean} ping Unused here.
   */
  load(ping) {
    this.loaded = true;
  }
}

exports = MockProvider;
