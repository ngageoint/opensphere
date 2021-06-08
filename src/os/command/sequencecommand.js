goog.module('os.command.SequenceCommand');
goog.module.declareLegacyNamespace();

const Timer = goog.require('goog.Timer');
const GoogEvent = goog.require('goog.events.Event');
const AbstractCommandSet = goog.require('os.command.AbstractCommandSet');
const EventType = goog.require('os.command.EventType');
const State = goog.require('os.command.State');

const EventTarget = goog.requireType('goog.events.EventTarget');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Runs a set of commands in sequence
 *
 * @implements {ICommand}
 */
class SequenceCommand extends AbstractCommandSet {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * Points to the index just after the last-executed command
     * @type {number}
     * @private
     */
    this.current_ = -1;
  }

  /**
   * Sets the set of commands
   *
   * @override
   * @param {Array<ICommand>} set The set of commands
   */
  setCommands(set) {
    super.setCommands(set);
    this.current_ = -1;
    this.state = State.READY;
    var n = set.length;
    if (n <= 0) {
      return;
    }
    for (var i = 0; i < n; i++) {
      var cmd = set[i];
      if (cmd.state === State.READY && this.current_ < 0) {
        this.current_ = i;
      } else if (cmd.state === State.SUCCESS || cmd.state === State.ERROR) {
        if (this.current_ >= 0 && i >= this.current_) {
          throw new Error('os.command.SequenceCommand: illegal state: ' +
              'the first ready sub-command must follow all executed sub-commands: ' +
              'first ready command [' + this.current_ + ']:' + set[this.current_].title +
              ' precedes ' + cmd.state + 'command [' + i + ']:' + set[i].title);
        }
        if (this.state !== State.ERROR) {
          this.state = cmd.state;
        }
      }
    }
    if (this.current_ >= 0 && this.current_ < set.length && this.state !== State.ERROR) {
      this.state = State.READY;
    } else {
      this.current_ = set.length;
    }
  }

  /**
   * @inheritDoc
   */
  execute() {
    if (this.state !== State.READY) {
      return false;
    }
    this.state = State.EXECUTING;
    return this.execute_();
  }

  /**
   * @inheritDoc
   */
  revert() {
    if (this.state !== State.SUCCESS) {
      return false;
    }
    this.current_--;
    this.state = State.REVERTING;
    return this.revert_();
  }

  /**
   * Execute the sub-commands.
   *
   * @return {boolean} true if all sub-commands return true, or the first
   *   async sub-command returns true, false otherwise
   * @private
   *
   * @todo
   * add timeout logic to remove the listener and fail the sequence if the
   * sub-command never fires EXECUTED
   */
  execute_() {
    /** @type {Array<ICommand>} */ var cmds = this.getCommands();
    /** @type {number} */ var n = cmds.length;

    while (this.current_ < n && this.state === State.EXECUTING) {
      /** @type {ICommand} */ var cmd = cmds[this.current_];
      /** @type {EventTarget} */ var cmdEvents = null;

      if (cmd.isAsync) {
        cmdEvents = /** @type {EventTarget} */ (cmd);
        cmdEvents.listenOnce(EventType.EXECUTED, this.onCommandExecuted_, false, this);
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
          cmdEvents.unlisten(EventType.EXECUTED, this.onCommandExecuted_, false, this);
        }
        this.state = State.ERROR;
        this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
        return false;
      }

      if (cmd.isAsync) {
        return true;
      }

      this.current_++;
    }

    this.state = State.SUCCESS;
    this.details = null;
    this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
    return true;
  }

  /**
   * Handle command executed.
   *
   * @private
   */
  onCommandExecuted_() {
    if (this.state !== State.EXECUTING) {
      return;
    }
    this.updateCurrentCommandDetails_();
    /** @type {ICommand} */
    var cmd = this.getCommands()[this.current_];
    if (cmd.state !== State.SUCCESS) {
      this.state = State.ERROR;
      this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
      return;
    }
    this.current_++;
    Timer.callOnce(this.execute_.bind(this));
  }

  /**
   * Begin the revert event loop.
   *
   * @return {boolean} true if successful, false if not
   * @private
   */
  revert_() {
    while (this.current_ > -1 && this.state === State.REVERTING) {
      /** @type {ICommand} */
      var cmd = this.getCommands()[this.current_];
      /** @type {EventTarget} */
      var cmdEvents = null;

      if (cmd.isAsync) {
        cmdEvents = /** @type {EventTarget} */ (cmd);
        cmdEvents.listenOnce(EventType.REVERTED, this.onCommandReverted_, false, this);
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
        this.state = State.ERROR;
        this.dispatchEvent(new GoogEvent(EventType.REVERTED));
        return false;
      }

      if (cmd.isAsync) {
        return true;
      }

      this.current_--;
    }

    this.current_ = 0;
    this.state = State.READY;
    this.details = null;
    this.dispatchEvent(new GoogEvent(EventType.REVERTED));
    return true;
  }

  /**
   * Handle command reverted.
   *
   * @private
   */
  onCommandReverted_() {
    if (this.state !== State.REVERTING) {
      return;
    }
    this.updateCurrentCommandDetails_();
    /** @type {ICommand} */
    var cmd = this.getCommands()[this.current_];
    if (cmd.state !== State.READY) {
      this.state = State.ERROR;
      this.dispatchEvent(new GoogEvent(EventType.REVERTED));
      return;
    }
    this.current_--;
    Timer.callOnce(this.revert_.bind(this));
  }

  /**
   * Set the details message appropriately for the current command state and the state of
   * the currently running command.
   *
   * @private
   */
  updateCurrentCommandDetails_() {
    var command = this.getCommands()[this.current_];
    if (this.state === State.EXECUTING) {
      if (command.state === State.ERROR) {
        this.details = command.details ||
            ('Command ' + (command.title || this.title + '[' + this.current_ + ']') + ' failed');
      } else {
        this.details = 'Executing';
      }
    } else if (this.state === State.REVERTING) {
      if (command.state === State.ERROR) {
        this.details = command.details ||
            ('Reverting command ' + (command.title || this.title + '[' + this.current_ + ']') + ' failed');
      } else {
        this.details = 'Reverting';
      }
    } else {
      this.details = null;
      return;
    }
  }
}

exports = SequenceCommand;
