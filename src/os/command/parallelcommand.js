goog.module('os.command.ParallelCommand');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const AbstractCommandSet = goog.require('os.command.AbstractCommandSet');
const EventType = goog.require('os.command.EventType');
const State = goog.require('os.command.State');

const EventTarget = goog.requireType('goog.events.EventTarget');
const ICommand = goog.requireType('os.command.ICommand');


/**
 * Runs a set of commands in parallel
 *
 * @implements {ICommand}
 *
 * @todo needs to handle sub-command exceptions and error state
 */
class ParallelCommand extends AbstractCommandSet {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * @type {number}
     * @private
     */
    this.count_ = 0;

    /**
     * @type {string}
     * @private
     */
    this.etype_ = EventType.EXECUTED;
  }

  /**
   * @inheritDoc
   */
  execute() {
    this.etype_ = EventType.EXECUTED;
    return this.run_();
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.etype_ = EventType.REVERTED;
    return this.run_();
  }

  /**
   * Runs or reverts the command
   *
   * @return {boolean} true if all sub-commands return true and do not throw errors, false otherwise
   * @private
   */
  run_() {
    /** @type {number} */
    var i;
    /** @type {number} */
    var n;
    this.count_ = 0;

    /** @type {Array<ICommand>} */
    var cmds = this.getCommands();

    for (i = 0, n = cmds.length; i < n; i++) {
      if (cmds[i].isAsync) {
        var et = /** @type {EventTarget} */ (cmds[i]);
        et.listenOnce(this.etype_, this.onCommandComplete_, false, this);
      }

      var success = false;
      try {
        if (this.etype_ == EventType.EXECUTED) {
          success = cmds[i].execute();
        } else {
          success = cmds[i].revert();
        }
      } catch (e) {
      }

      if (!success) {
        this.state = State.ERROR;
        this.dispatchEvent(new GoogEvent(EventType.EXECUTED));
        return false;
      }

      if (!cmds[i].isAsync) {
        this.onCommandComplete_(null);
      }
    }

    if (this.etype_ === EventType.EXECUTED) {
      this.state = State.SUCCESS;
    } else {
      this.state = State.READY;
    }
    return true;
  }

  /**
   * Handles command completion
   *
   * @param {?GoogEvent} e The event
   * @private
   */
  onCommandComplete_(e) {
    this.count_++;
    if (this.count_ == this.getCommands().length) {
      this.dispatchEvent(new GoogEvent(this.etype_));
    }
  }
}

exports = ParallelCommand;
