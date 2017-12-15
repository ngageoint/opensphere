goog.provide('os.ui.state.cmd.StateDelete');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Commnad removes local states
 * @implements {os.command.ICommand}
 * @constructor
 */
os.ui.state.cmd.StateDelete = function() {
  this.isAsync = false;
  this.title = 'Delete States';
  this.details = null;
  this.state = os.command.State.READY;

  /**
   * @type {!Array.<string>}
   * @private
   */
  this.lastActive_ = [];
};


/**
 * @inheritDoc
 */
os.ui.state.cmd.StateDelete.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;
  this.lastActive_.length = 0;

  os.ui.stateManager.deleteStates();

  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
os.ui.state.cmd.StateDelete.prototype.revert = function() {
  // this command cannot be reverted
  return false;
};
