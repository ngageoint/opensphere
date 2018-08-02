goog.provide('os.command.SequenceCommand');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('os.command.AbstractCommandSet');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');



/**
 * Runs a set of commands in sequence
 * @implements {os.command.ICommand}
 * @extends {os.command.AbstractCommandSet}
 * @constructor
 */
os.command.SequenceCommand = function() {
  os.command.SequenceCommand.base(this, 'constructor');
};
goog.inherits(os.command.SequenceCommand, os.command.AbstractCommandSet);


/**
 * Points to the index just after the last-executed command
 * @private
 * @type {number}
 */
os.command.SequenceCommand.prototype.current_ = -1;


/**
 * Sets the set of commands
 * @override
 * @param {Array.<os.command.ICommand>} set The set of commands
 */
os.command.SequenceCommand.prototype.setCommands = function(set) {
  os.command.SequenceCommand.superClass_.setCommands.call(this, set);
  this.current_ = -1;
  this.state = os.command.State.READY;
  var n = set.length;
  if (n <= 0) {
    return;
  }
  for (var i = 0; i < n; i++) {
    var cmd = set[i];
    if (cmd.state === os.command.State.READY && this.current_ < 0) {
      this.current_ = i;
    } else if (cmd.state === os.command.State.SUCCESS || cmd.state === os.command.State.ERROR) {
      if (this.current_ >= 0 && i >= this.current_) {
        throw new Error('os.command.SequenceCommand: illegal state: ' +
            'the first ready sub-command must follow all executed sub-commands: ' +
            'first ready command [' + this.current_ + ']:' + set[this.current_].title +
            ' precedes ' + cmd.state + 'command [' + i + ']:' + set[i].title);
      }
      if (this.state !== os.command.State.ERROR) {
        this.state = cmd.state;
      }
    }
  }
  if (this.current_ >= 0 && this.current_ < set.length && this.state !== os.command.State.ERROR) {
    this.state = os.command.State.READY;
  } else {
    this.current_ = set.length;
  }
};


/**
 * @inheritDoc
 */
os.command.SequenceCommand.prototype.execute = function() {
  if (this.state !== os.command.State.READY) {
    return false;
  }
  this.state = os.command.State.EXECUTING;
  return this.execute_();
};


/**
 * @inheritDoc
 */
os.command.SequenceCommand.prototype.revert = function() {
  if (this.state !== os.command.State.SUCCESS) {
    return false;
  }
  this.current_--;
  this.state = os.command.State.REVERTING;
  return this.revert_();
};


/**
 * Execute the sub-commands.
 * @return {boolean} true if all sub-commands return true, or the first
 *   async sub-command returns true, false otherwise
 * @private
 *
 * @todo
 * add timeout logic to remove the listener and fail the sequence if the
 * sub-command never fires EXECUTED
 */
os.command.SequenceCommand.prototype.execute_ = function() {
  /** @type {Array.<os.command.ICommand>} */ var cmds = this.getCommands();
  /** @type {number} */ var n = cmds.length;

  while (this.current_ < n && this.state === os.command.State.EXECUTING) {
    /** @type {os.command.ICommand} */ var cmd = cmds[this.current_];
    /** @type {goog.events.EventTarget} */ var cmdEvents = null;

    if (cmd.isAsync) {
      cmdEvents = /** @type {goog.events.EventTarget} */ (cmd);
      cmdEvents.listenOnce(os.command.EventType.EXECUTED, this.onCommandExecuted_, false, this);
    }

    var success = false;
    try {
      success = cmd.execute();
      if (!success) {
        this.updateCurrentCommandDetails_();
      }
    } catch (e) {
      this.details = 'Error executing command ' + cmd.title + ': ' + String(e);
    }

    if (!success) {
      if (cmdEvents) {
        cmdEvents.unlisten(os.command.EventType.EXECUTED, this.onCommandExecuted_, false, this);
      }
      this.state = os.command.State.ERROR;
      this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
      return false;
    }

    if (cmd.isAsync) {
      return true;
    }

    this.current_++;
  }

  this.state = os.command.State.SUCCESS;
  this.details = null;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
  return true;
};


/**
 * Handle command executed.
 * @private
 */
os.command.SequenceCommand.prototype.onCommandExecuted_ = function() {
  if (this.state !== os.command.State.EXECUTING) {
    return;
  }
  this.updateCurrentCommandDetails_();
  /** @type {os.command.ICommand} */
  var cmd = this.getCommands()[this.current_];
  if (cmd.state !== os.command.State.SUCCESS) {
    this.state = os.command.State.ERROR;
    this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
    return;
  }
  this.current_++;
  goog.Timer.callOnce(this.execute_.bind(this));
};


/**
 * Begin the revert event loop.
 * @return {boolean} true if successful, false if not
 * @private
 */
os.command.SequenceCommand.prototype.revert_ = function() {
  while (this.current_ > -1 && this.state === os.command.State.REVERTING) {
    /** @type {os.command.ICommand} */
    var cmd = this.getCommands()[this.current_];
    /** @type {goog.events.EventTarget} */
    var cmdEvents = null;

    if (cmd.isAsync) {
      cmdEvents = /** @type {goog.events.EventTarget} */ (cmd);
      cmdEvents.listenOnce(os.command.EventType.REVERTED, this.onCommandReverted_, false, this);
    }

    var success = false;
    try {
      success = cmd.revert();
      if (!success) {
        this.updateCurrentCommandDetails_();
      }
    } catch (e) {
      this.details = 'Error reverting command ' + cmd.title + ': ' + String(e);
    }

    if (!success) {
      this.state = os.command.State.ERROR;
      this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
      return false;
    }

    if (cmd.isAsync) {
      return true;
    }

    this.current_--;
  }

  this.current_ = 0;
  this.state = os.command.State.READY;
  this.details = null;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
  return true;
};


/**
 * Handle command reverted.
 * @private
 */
os.command.SequenceCommand.prototype.onCommandReverted_ = function() {
  if (this.state !== os.command.State.REVERTING) {
    return;
  }
  this.updateCurrentCommandDetails_();
  /** @type {os.command.ICommand} */
  var cmd = this.getCommands()[this.current_];
  if (cmd.state !== os.command.State.READY) {
    this.state = os.command.State.ERROR;
    this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
    return;
  }
  this.current_--;
  goog.Timer.callOnce(this.revert_.bind(this));
};


/**
 * Set the details message appropriately for the current command state and the state of
 * the currently running command.
 * @private
 */
os.command.SequenceCommand.prototype.updateCurrentCommandDetails_ = function() {
  var command = this.getCommands()[this.current_];
  if (this.state === os.command.State.EXECUTING) {
    if (command.state === os.command.State.ERROR) {
      this.details = command.details ||
          ('Command ' + (command.title || this.title + '[' + this.current_ + ']') + ' failed');
    } else {
      this.details = 'Executing';
    }
  } else if (this.state === os.command.State.REVERTING) {
    if (command.state === os.command.State.ERROR) {
      this.details = command.details ||
          ('Reverting command ' + (command.title || this.title + '[' + this.current_ + ']') + ' failed');
    } else {
      this.details = 'Reverting';
    }
  } else {
    this.details = null;
    return;
  }
};
