goog.provide('os.command.AbstractSyncCommand');
goog.require('goog.Disposable');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Abstract synchronous command implementation.
 *
 * @abstract
 * @implements {os.command.ICommand}
 * @extends {goog.Disposable}
 * @constructor
 */
os.command.AbstractSyncCommand = function() {
  os.command.AbstractSyncCommand.base(this, 'constructor');

  /**
   * The details of the command.
   * @type {?string}
   */
  this.details = null;

  /**
   * Whether or not the command is asynchronous.
   * @type {boolean}
   */
  this.isAsync = false;

  /**
   * Return the current state of the command.
   * @type {!os.command.State}
   */
  this.state = os.command.State.READY;

  /**
   * The title of the command.
   * @type {?string}
   */
  this.title = '';
};
goog.inherits(os.command.AbstractSyncCommand, goog.Disposable);


/**
 * @abstract
 * @inheritDoc
 */
os.command.AbstractSyncCommand.prototype.execute = function() {};


/**
 * Mark the command as completed.
 *
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
 *
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
