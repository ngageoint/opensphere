goog.provide('os.command.ParallelCommand');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.command.AbstractCommandSet');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Runs a set of commands in parallel
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractCommandSet}
 * @constructor
 *
 * @todo needs to handle sub-command exceptions and error state
 */
os.command.ParallelCommand = function() {
  os.command.ParallelCommand.base(this, 'constructor');
};
goog.inherits(os.command.ParallelCommand, os.command.AbstractCommandSet);


/**
 * @type {number}
 * @private
 */
os.command.ParallelCommand.prototype.count_ = 0;


/**
 * @type {string}
 * @private
 */
os.command.ParallelCommand.prototype.etype_ = os.command.EventType.EXECUTED;


/**
 * @inheritDoc
 */
os.command.ParallelCommand.prototype.execute = function() {
  this.etype_ = os.command.EventType.EXECUTED;
  return this.run_();
};


/**
 * @inheritDoc
 */
os.command.ParallelCommand.prototype.revert = function() {
  this.etype_ = os.command.EventType.REVERTED;
  return this.run_();
};


/**
 * Runs or reverts the command
 * @return {boolean} true if all sub-commands return true and do not throw errors, false otherwise
 * @private
 */
os.command.ParallelCommand.prototype.run_ = function() {
  /** @type {number} */
  var i;
  /** @type {number} */
  var n;
  this.count_ = 0;

  /** @type {Array.<os.command.ICommand>} */
  var cmds = this.getCommands();

  for (i = 0, n = cmds.length; i < n; i++) {
    if (cmds[i].isAsync) {
      var et = /** @type {goog.events.EventTarget} */ (cmds[i]);
      et.listenOnce(this.etype_, this.onCommandComplete_, false, this);
    }

    var success = false;
    try {
      if (this.etype_ == os.command.EventType.EXECUTED) {
        success = cmds[i].execute();
      } else {
        success = cmds[i].revert();
      }
    } catch (e) {
    }

    if (!success) {
      this.state = os.command.State.ERROR;
      this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
      return false;
    }

    if (!cmds[i].isAsync) {
      this.onCommandComplete_(null);
    }
  }

  if (this.etype_ === os.command.EventType.EXECUTED) {
    this.state = os.command.State.SUCCESS;
  } else {
    this.state = os.command.State.READY;
  }
  return true;
};


/**
 * Handles command completion
 * @param {?goog.events.Event} e The event
 * @private
 */
os.command.ParallelCommand.prototype.onCommandComplete_ = function(e) {
  this.count_++;
  if (this.count_ == this.getCommands().length) {
    this.dispatchEvent(new goog.events.Event(this.etype_));
  }
};
