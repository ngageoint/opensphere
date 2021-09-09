goog.module('os.plugin.MockErrorPlugin');

const Promise = goog.require('goog.Promise');
const MockPlugin = goog.require('os.plugin.MockPlugin');


/**
 * Mock plugin the dispatches/throws errors.
 */
class MockErrorPlugin extends MockPlugin {
  /**
   * Constructor.
   * @param {Object=} opt_options Mock plugin options
   */
  constructor(opt_options) {
    var options = opt_options || {};
    options.id = options.id || 'error';

    super(options);
  }

  /**
   * @inheritDoc
   */
  init() {
    if (this.options.shouldThrow) {
      throw new Error(this.options.errorMessage || 'fail');
    }

    return new Promise(function(resolve, reject) {
      setTimeout(reject, this.options.initTimeout || 10);
    });
  }
}

exports = MockErrorPlugin;
