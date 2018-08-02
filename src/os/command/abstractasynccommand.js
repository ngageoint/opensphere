goog.provide('os.command.AbstractAsyncCommand');
goog.require('goog.Uri');
goog.require('goog.events.EventTarget');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract asynchronous command implementation.
 * @implements {os.command.ICommand}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.command.AbstractAsyncCommand = function() {
  os.command.AbstractAsyncCommand.base(this, 'constructor');
  this.details = null;
  this.isAsync = true;
  this.state = os.command.State.READY;
  this.title = '';
};
goog.inherits(os.command.AbstractAsyncCommand, goog.events.EventTarget);


/**
 * @inheritDoc
 */
os.command.AbstractAsyncCommand.prototype.execute = goog.abstractMethod;


/**
 * Mark the command as completed.
 * @param {string=} opt_detail Optional detail message
 * @return {boolean}
 * @protected
 */
os.command.AbstractAsyncCommand.prototype.finish = function(opt_detail) {
  this.detail = opt_detail || null;
  this.state = os.command.State.SUCCESS;
  this.dispatchEvent(os.command.EventType.EXECUTED);
  return true;
};


/**
 * Set the error state.
 * @param {string} msg The error message.
 * @return {boolean}
 * @protected
 */
os.command.AbstractAsyncCommand.prototype.handleError = function(msg) {
  var eventType = this.state == os.command.State.REVERTING ? os.command.EventType.REVERTED :
      os.command.EventType.EXECUTED;

  this.state = os.command.State.ERROR;
  this.details = msg;
  this.dispatchEvent(eventType);
  return false;
};


/**
 * @inheritDoc
 */
os.command.AbstractAsyncCommand.prototype.revert = function() {
  this.state = os.command.State.READY;
  this.details = null;
  this.dispatchEvent(os.command.EventType.REVERTED);
  return true;
};
