goog.module('os.ui.state.cmd.StateClear');
goog.module.declareLegacyNamespace();

const ui = goog.require('os.ui');
const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Command for clearing (deactivating) states loaded in the application.
 *
 * @implements {ICommand}
 */
class StateClear {
  /**
   * Constructor.
   */
  constructor() {
    this.isAsync = false;
    this.title = 'Clear States';
    this.details = null;
    this.state = State.READY;

    /**
     * @type {!Array.<string>}
     * @private
     */
    this.lastActive_ = [];
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.state = State.EXECUTING;
    this.lastActive_.length = 0;

    var dm = os.dataManager;
    var descriptors = dm.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var descriptor = descriptors[i];
      if (descriptor instanceof ui.state.AbstractStateDescriptor && descriptor.isActive()) {
        this.lastActive_.push(descriptor.getId());
      }
    }

    os.stateManager.clearStates();

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var dm = os.dataManager;
    for (var i = 0, n = this.lastActive_.length; i < n; i++) {
      var descriptor = /** @type {ui.state.IStateDescriptor} */ (dm.getDescriptor(this.lastActive_[i]));
      if (descriptor) {
        // activate the state without putting a command on the stack
        descriptor.setActive(true);
      }
    }

    this.lastActive_.length = 0;

    this.state = State.READY;
    return true;
  }
}

exports = StateClear;
