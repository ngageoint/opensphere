goog.declareModuleId('os.ui.state.cmd.StateClear');

import AbstractStateDescriptor from '../abstractstatedescriptor.js';

const State = goog.require('os.command.State');
const DataManager = goog.require('os.data.DataManager');
const {getStateManager} = goog.require('os.state.instance');

const ICommand = goog.requireType('os.command.ICommand');
const {default: IStateDescriptor} = goog.requireType('os.ui.state.IStateDescriptor');


/**
 * Command for clearing (deactivating) states loaded in the application.
 *
 * @implements {ICommand}
 */
export default class StateClear {
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

    var dm = DataManager.getInstance();
    var descriptors = dm.getDescriptors();
    for (var i = 0, n = descriptors.length; i < n; i++) {
      var descriptor = descriptors[i];
      if (descriptor instanceof AbstractStateDescriptor && descriptor.isActive()) {
        this.lastActive_.push(descriptor.getId());
      }
    }

    getStateManager().clearStates();

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.REVERTING;

    var dm = DataManager.getInstance();
    for (var i = 0, n = this.lastActive_.length; i < n; i++) {
      var descriptor = /** @type {IStateDescriptor} */ (dm.getDescriptor(this.lastActive_[i]));
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
