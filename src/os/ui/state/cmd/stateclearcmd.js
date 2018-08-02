goog.provide('os.ui.state.cmd.StateClear');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Command for clearing (deactivating) states loaded in the application.
 * @implements {os.command.ICommand}
 * @constructor
 */
os.ui.state.cmd.StateClear = function() {
  this.isAsync = false;
  this.title = 'Clear States';
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
os.ui.state.cmd.StateClear.prototype.execute = function() {
  this.state = os.command.State.EXECUTING;
  this.lastActive_.length = 0;

  var dm = os.dataManager;
  var descriptors = dm.getDescriptors();
  for (var i = 0, n = descriptors.length; i < n; i++) {
    var descriptor = descriptors[i];
    if (descriptor instanceof os.ui.state.AbstractStateDescriptor && descriptor.isActive()) {
      this.lastActive_.push(descriptor.getId());
    }
  }

  os.ui.stateManager.clearStates();

  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * @inheritDoc
 */
os.ui.state.cmd.StateClear.prototype.revert = function() {
  this.state = os.command.State.REVERTING;

  var dm = os.dataManager;
  for (var i = 0, n = this.lastActive_.length; i < n; i++) {
    var descriptor = /** @type {os.ui.state.IStateDescriptor} */ (dm.getDescriptor(this.lastActive_[i]));
    if (descriptor) {
      // activate the state without putting a command on the stack
      descriptor.setActive(true);
    }
  }

  this.lastActive_.length = 0;

  this.state = os.command.State.READY;
  return true;
};
