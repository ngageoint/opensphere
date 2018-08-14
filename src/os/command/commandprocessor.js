goog.provide('os.command.CommandProcessor');
goog.require('goog.debug.LogManager');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.command.CommandEvent');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Executes commands in sequence. The command queue size is limited to
 * <code>getMaxQueueSize()</code>. Undo and redo operations are supported. Both
 * synchronous and asynchronous commands are supported, however, synchronous
 * commands that kick off jobs are recommended over asynchronous commands
 * unless the asynchronous processing is quick enough to make that overkill.
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.command.CommandProcessor = function() {
  os.command.CommandProcessor.base(this, 'constructor');

  /**
   * The command history
   * @private
   * @type {Array.<os.command.ICommand>}
   */
  this.history_ = [];

  /**
   * The max command queue size
   * @private
   * @type {number}
   */
  this.historyLimit_ = 50;

  /**
   * The temporary queue
   * @private
   * @type {Array.<os.command.ICommand>}
   */
  this.tmpQueue_ = [];

  /**
   * Points to the history index of the last-executed command
   * @private
   * @type {number}
   */
  this.current_ = -1;

  /**
   * The execution target. This is the target index within the command history that the
   * command processor is attempting to reach. A value less than zero indicates that the
   * target is the beginning of the command history (undo all commands).
   * @private
   * @type {number}
   */
  this.target_ = -1;

  /**
   * @type {Array<function(os.command.ICommand):boolean>}
   * @private
   */
  this.checkFunctions_ = [];
};
goog.inherits(os.command.CommandProcessor, goog.events.EventTarget);
goog.addSingletonGetter(os.command.CommandProcessor);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.command.CommandProcessor.LOGGER_ =
    goog.log.getLogger('os.command.CommandProcessor');


/**
 * Gets the current history index
 * @return {number}
 */
os.command.CommandProcessor.prototype.getCurrent = function() {
  return this.current_;
};


/**
 * Checks if the current index is not equal to the target or if any of the commands in the stack are currently
 * in the executing state. It's possible for the current and target to be equal while still having a command processing.
 * @return {boolean}
 */
os.command.CommandProcessor.prototype.isProcessing = function() {
  return this.current_ != this.target_ || goog.array.some(this.history_, function(cmd) {
    return cmd.state === os.command.State.EXECUTING;
  });
};


/**
 * Returns the max queue size
 * @return {number} The max queue size
 */
os.command.CommandProcessor.prototype.getHistoryLimit = function() {
  return this.historyLimit_;
};


/**
 * Sets the max queue size.
 * @param {number} value The maximum size of the command queue
 * @throws {Error} If you try to set the max queue size while asynchronous
 *  commands are running
 */
os.command.CommandProcessor.prototype.setHistoryLimit = function(value) {
  if (this.isProcessing()) {
    throw new Error('Setting the max queue size while processing asynchronous' +
        ' commands is not allowed!. Consider having the command run a job' +
        ' instead.');
  }

  this.historyLimit_ = value;
  this.resizeHistory_();
  this.dispatchEvent(new goog.events.Event(os.command.EventType.HISTORY_LIMIT_CHANGED));
};


/**
 * Returns the entire command history
 * @return {Array.<os.command.ICommand>} The command history
 */
os.command.CommandProcessor.prototype.getHistory = function() {
  return this.history_;
};


/**
 * Clears the entire command history. This is not undoable.
 */
os.command.CommandProcessor.prototype.clearHistory = function() {
  var oldLimit = this.getHistoryLimit();
  this.setHistoryLimit(0);
  this.setHistoryLimit(oldLimit);
};


/**
 * Adds a command to the command queue.
 * @param {os.command.ICommand} command The command to add.
 * @return {boolean} whether or not the command was successfully added
 */
os.command.CommandProcessor.prototype.addCommand = function(command) {
  if (!this.checkCommand(command)) {
    return false;
  }

  if (this.isProcessing()) {
    goog.log.fine(os.command.CommandProcessor.LOGGER_,
        'Processing is under way. Added "' + command.title + '" command to temporary queue.');
    this.tmpQueue_.push(command);
    return true;
  }

  /**
   * @todo
   * hold off truncation until after successful execution?  if not, and the command fails,
   * we cannot get the truncated history back.  that might be ok.
   */
  if (this.current_ < this.history_.length) {
    // truncate the history to the current pointer because we're starting fresh from there
    this.history_.length = this.current_ + 1;
  }

  this.target_++;

  if (command.state === os.command.State.READY) {
    this.execute_(command);
  } else {
    this.onCommandComplete_(null, command);
  }

  return true;
};


/**
 * @param {function(os.command.ICommand):boolean} func
 */
os.command.CommandProcessor.prototype.registerCheckFunction = function(func) {
  this.checkFunctions_.push(func);
};


/**
 * @param {os.command.ICommand} command
 * @return {boolean} Whether or not the command is valid
 * @protected
 */
os.command.CommandProcessor.prototype.checkCommand = function(command) {
  if (command.state === os.command.State.ERROR) {
    return false;
  }

  var val = true;
  for (var i = 0, n = this.checkFunctions_.length; i < n && val; i++) {
    if (!this.checkFunctions_[i](command)) {
      val = false;
    }
  }

  return val;
};


/**
 * Resize the history to the history limit, dumping the earliest commands if necessary.
 * @private
 */
os.command.CommandProcessor.prototype.resizeHistory_ = function() {
  while (this.history_.length > this.historyLimit_) {
    var command = this.history_.shift();
    this.destroyCommand_(command);
    if (this.current_ > -1) {
      this.current_--;
    }
  }

  this.target_ = this.current_;
};


/**
 * Calls dispose on a command if the function exists.
 * @param {os.command.ICommand} command
 * @private
 */
os.command.CommandProcessor.prototype.destroyCommand_ = function(command) {
  try {
    goog.dispose(command);
  } catch (e) {
    goog.log.error(os.command.CommandProcessor.LOGGER_,
        'error disposing command "' + command.title + '": ' + String(e));
  }
};


/**
 * Undo the current (most recently executed) command.
 */
os.command.CommandProcessor.prototype.undo = function() {
  goog.log.fine(os.command.CommandProcessor.LOGGER_, 'undo' + this.current_);
  if ((this.history_.length && this.current_ > -1) || this.target_ > -1) {
    this.setIndex(this.target_ - 1);
  }
};


/**
 * Redo the command after the current command.
 */
os.command.CommandProcessor.prototype.redo = function() {
  goog.log.fine(os.command.CommandProcessor.LOGGER_, 'redo ' + this.current_);
  if (this.history_.length && this.current_ < this.history_.length - 1) {
    this.setIndex(this.target_ + 1);
  }
};


/**
 * Executes or reverts commands until the current pointer equals the
 * given index.
 * @param {number} index The index to execute or revert to.
 * @todo There is a problem with setIndex calls after calling setMaxQueueSize.
 * If you are on the earliest element in the queue (one that gets kicked off by
 * the setMaxQueueSize call) then this.current_ gets set to -1, and any time
 * this method gets called, it breaks because this.history_[this.current_]
 * gets called with this.current_ = -1.
 */
os.command.CommandProcessor.prototype.setIndex = function(index) {
  if (!this.isProcessing()) {
    // not processing, so update the target and start processing the change
    this.target_ = Math.min(this.history_.length - 1, Math.max(-1, index));
    if (this.target_ < this.current_) {
      this.revert_(this.history_[this.current_]);
    } else if (this.target_ > this.current_) {
      this.execute_(this.history_[this.current_ + 1]);
    }
  } else {
    // processing a command, so just update the target
    this.target_ = Math.min(this.history_.length - 1, Math.max(-1, index));
  }
};


/**
 * Executes a command.
 * @private
 * @param {os.command.ICommand} command The command to execute
 * @return {boolean} the result of the command execution
 */
os.command.CommandProcessor.prototype.execute_ = function(command) {
  var et;
  goog.log.info(os.command.CommandProcessor.LOGGER_, 'executing "' + command.title + '" command');

  if (command.isAsync) {
    et = /** @type {goog.events.EventTarget} */ (command);
    et.listenOnce(os.command.EventType.EXECUTED, this.onCommandComplete_, false, this);
  }

  this.dispatchEvent(new os.command.CommandEvent(os.command.EventType.COMMAND_EXECUTING, command));

  var success = false;

  try {
    success = command.execute();
  } catch (e) {
    success = false;
    goog.log.error(os.command.CommandProcessor.LOGGER_, 'Error executing command "' + command.title, e);
  }

  if (!success) {
    if (command.isAsync) {
      et = /** @type {goog.events.EventTarget} */ (command);
      et.unlisten(os.command.EventType.EXECUTED, this.onCommandComplete_, false, this);
    }

    command.state = os.command.State.ERROR;
    this.onCommandComplete_(null, command);
  } else if (!command.isAsync) {
    this.onCommandComplete_(null, command);
  }

  return success;
};


/**
 * Reverts a command.
 * @private
 * @param {os.command.ICommand} command The command to execute
 *
 * @todo handle failing reverts
 */
os.command.CommandProcessor.prototype.revert_ = function(command) {
  var et;
  this.dispatchEvent(new os.command.CommandEvent(os.command.EventType.COMMAND_REVERTING, command));

  goog.log.info(os.command.CommandProcessor.LOGGER_, 'reverting "' + command.title + '" command');

  if (command.isAsync) {
    et = /** @type {goog.events.EventTarget} */ (command);
    et.listenOnce(os.command.EventType.REVERTED, this.onCommandReverted_, false, this);
  }

  var success = false;

  try {
    success = command.revert();
  } catch (e) {
    success = false;
    goog.log.error(os.command.CommandProcessor.LOGGER_, 'Error reverting command "' + command.title, e);
  }

  if (!success) {
    if (command.isAsync) {
      et = /** @type {goog.events.EventTarget} */ (command);
      et.unlisten(os.command.EventType.REVERTED, this.onCommandReverted_, false, this);
    }

    command.state = os.command.State.ERROR;
    this.onCommandReverted_(null, command);
  } else if (!command.isAsync) {
    this.onCommandReverted_(null, command);
  }
};


/**
 * Merges in the temporary queue (which contains commands added while
 * processing asnchronous commands) and begins to process it.
 * @private
 */
os.command.CommandProcessor.prototype.processQueue_ = function() {
  if (this.tmpQueue_.length > 0) {
    // dump everything after the current index
    this.history_.length = this.current_ + 1;
    this.addCommand(this.tmpQueue_.shift());
  }
};


/**
 * Handles the completion of commands
 * @param {goog.events.Event} e The event
 * @param {os.command.ICommand=} opt_command
 * @private
 */
os.command.CommandProcessor.prototype.onCommandComplete_ = function(e, opt_command) {
  var command = opt_command || /** @type {os.command.ICommand} */ (e.target);

  this.dispatchEvent(new os.command.CommandEvent(os.command.EventType.COMMAND_EXECUTED, command));

  if (command.state === os.command.State.SUCCESS) {
    this.current_++;
    if (this.current_ == this.history_.length) {
      // it's a new command, not just setting the current index
      this.history_.push(command);

      // if the target is greater than the current, then do the resize, otherwise it can blow up
      if (this.target_ >= this.current_) {
        this.resizeHistory_();
      }

      goog.log.info(os.command.CommandProcessor.LOGGER_, 'Added "' + command.title + '" command to history.');
      this.dispatchEvent(new os.command.CommandEvent(os.command.EventType.COMMAND_ADDED, command));
    }
  } else {
    this.target_--;
    if (command === this.history_[this.current_ + 1]) {
      // this is setting the current index, and the command was already present in the history,
      // so remove the failed command from the history
      this.history_.splice(this.current_ + 1, 1);
      goog.log.error(os.command.CommandProcessor.LOGGER_,
          'Removed "' + command.title + '" [' + this.current_ + 1 + '] command from history after error.');
    } else if (command.details) {
      // log the error details
      goog.log.error(os.command.CommandProcessor.LOGGER_,
          'Error running command ' + command.title + ' - ' + command.details);
    }
  }

  if (this.current_ < this.target_) {
    this.execute_(this.history_[this.current_ + 1]);
  } else if (this.tmpQueue_.length > 0) {
    // we have additional commands queue, do them
    this.processQueue_();
  } else if (this.current_ > this.target_) {
    // an undo occurred while executing the command, so go back to hit the target
    this.revert_(this.history_[this.current_]);
  }
};


/**
 * Handles commands that have been reverted
 * @param {goog.events.Event} e the event
 * @param {os.command.ICommand=} opt_command the command that was reverted
 * @private
 */
os.command.CommandProcessor.prototype.onCommandReverted_ = function(e, opt_command) {
  var command = opt_command || /** @type {os.command.ICommand} */ (e.target);

  this.current_--;

  this.dispatchEvent(new os.command.CommandEvent(os.command.EventType.COMMAND_REVERTED, command));

  if (this.current_ > this.target_) {
    this.revert_(this.history_[this.current_]);
  } else {
    this.processQueue_();
  }
};


/**
 * Global reference to the singleton.
 * @type {!os.command.CommandProcessor}
 */
os.commandStack = os.command.CommandProcessor.getInstance();
