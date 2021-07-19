goog.module('os.ui.state.StateProvider');
goog.module.declareLegacyNamespace();

const {getAppName} = goog.require('os.config');
const DescriptorProvider = goog.require('os.ui.data.DescriptorProvider');
const AbstractStateDescriptor = goog.require('os.ui.state.AbstractStateDescriptor');

/**
 * State file provider
 *
 * @extends {DescriptorProvider<!AbstractStateDescriptor>}
 */
class StateProvider extends DescriptorProvider {
  /**
   * Constructor.
   */
  constructor() {
    super();
  }

  /**
   * @inheritDoc
   */
  configure(config) {
    this.setId(AbstractStateDescriptor.ID);
    this.setLabel('State Files');

    super.configure(config);

    // this provider should not show up in the server manager
    this.listInServers = false;
  }

  /**
   * @inheritDoc
   */
  load(opt_ping) {
    super.load(opt_ping);

    // After loading activate the states.
    var descriptors = this.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var descriptor = descriptors[i];
      descriptor.updateActiveFromTemp();
    }
  }

  /**
   * @inheritDoc
   */
  getToolTip() {
    var appName = getAppName('the application');
    return 'Contains all state files that have been imported into ' + appName;
  }

  /**
   * @inheritDoc
   */
  getErrorMessage() {
    return null;
  }

  /**
   * Get the global instance.
   * @return {!StateProvider}
   */
  static getInstance() {
    if (!instance) {
      instance = new StateProvider();
    }

    return instance;
  }

  /**
   * Set the global instance.
   * @param {StateProvider} value
   */
  static setInstance(value) {
    instance = value;
  }
}

/**
 * Global instance.
 * @type {StateProvider|undefined}
 */
let instance;

exports = StateProvider;
