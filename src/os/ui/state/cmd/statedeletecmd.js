goog.module('os.ui.state.cmd.StateDelete');
goog.module.declareLegacyNamespace();

const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Commnad removes local states
 *
 * @implements {ICommand}
 */
class StateDelete {
  /**
   * Constructor.
   */
  constructor() {
    this.isAsync = false;
    this.title = 'Delete States';
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

    os.stateManager.deleteStates();

    this.state = State.SUCCESS;
    return true;
  }

  /**
   * @inheritDoc
   */
  revert() {
    // this command cannot be reverted
    return false;
  }
}

exports = StateDelete;
