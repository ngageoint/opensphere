goog.declareModuleId('os.ui.state.cmd.StateDelete');

import State from '../../../command/state.js';
import {getStateManager} from '../../../state/stateinstance.js';

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Commnad removes local states
 *
 * @implements {ICommand}
 */
export default class StateDelete {
  /**
   * Constructor.
   */
  constructor() {
    this.isAsync = false;
    this.title = 'Delete States';
    this.details = null;
    this.state = State.READY;

    /**
     * @type {!Array<string>}
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

    getStateManager().deleteStates();

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
