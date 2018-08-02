goog.provide('os.command.AbstractSyncCommand');
goog.require('goog.Disposable');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract synchronous command implementation.
 * @implements {os.command.ICommand}
 * @extends {goog.Disposable}
 * @constructor
 */
os.command.AbstractSyncCommand = function() {
  os.command.AbstractSyncCommand.base(this, 'constructor');
  this.details = null;
  this.isAsync = false;
  this.state = os.command.State.READY;
  this.title = '';
};
goog.inherits(os.command.AbstractSyncCommand, goog.Disposable);


/**
 * @inheritDoc
 */
os.command.AbstractSyncCommand.prototype.execute = goog.abstractMethod;


/**
 * Mark the command as completed.
 * @param {string=} opt_detail Optional detail message
 * @return {boolean}
 * @protected
 */
os.command.AbstractSyncCommand.prototype.finish = function(opt_detail) {
  this.detail = opt_detail || null;
  this.state = os.command.State.SUCCESS;
  return true;
};


/**
 * Set the error state.
 * @param {string} msg The error message.
 * @return {boolean}
 * @protected
 */
os.command.AbstractSyncCommand.prototype.handleError = function(msg) {
  this.state = os.command.State.ERROR;
  this.details = msg;
  return false;
};


/**
 * @inheritDoc
 */
os.command.AbstractSyncCommand.prototype.revert = function() {
  this.state = os.command.State.READY;
  this.details = null;
  return true;
};
