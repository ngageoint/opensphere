goog.module('os.plugin.MockPlugin');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const AbstractPlugin = goog.require('os.plugin.AbstractPlugin');


/**
 * Mock plugin that loads after a timeout.
 */
class MockPlugin extends AbstractPlugin {
  /**
   * Constructor.
   * @param {Object=} opt_options Mock plugin options
   */
  constructor(opt_options) {
    super();

    var options = opt_options || {};

    this.id = options.id || 'mock';
    this.init_ = false;
    this.errorMessage = null;
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  init() {
    var initTimeout = this.options.initTimeout != null ? this.options.initTimeout : 10;

    if (initTimeout > 0) {
      return new Promise(function(resolve, reject) {
        setTimeout(resolve, initTimeout);
      });
    }
  }
}

exports = MockPlugin;
