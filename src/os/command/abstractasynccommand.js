goog.module('os.command.AbstractAsyncCommand');
goog.module.declareLegacyNamespace();

const EventTarget = goog.require('goog.events.EventTarget');
const EventType = goog.require('os.command.EventType');
const State = goog.require('os.command.State');

const ICommand = goog.requireType('os.command.ICommand');


/**
 * Abstract asynchronous command implementation.
 *
 * @abstract
 * @implements {ICommand}
 */
class AbstractAsyncCommand extends EventTarget {
  /**
   * Constructor.
   */
  constructor() {
    super();

    /**
     * The details of the command.
     * @type {?string}
     */
    this.details = null;

    /**
     * Whether or not the command is asynchronous.
     * @type {boolean}
     */
    this.isAsync = true;

    /**
     * Return the current state of the command.
     * @type {!State}
     */
    this.state = State.READY;

    /**
     * The title of the command.
     * @type {?string}
     */
    this.title = '';
  }

  /**
   * Mark the command as completed.
   *
   * @param {string=} opt_detail Optional detail message
   * @return {boolean}
   * @protected
   */
  finish(opt_detail) {
    this.details = opt_detail || null;
    this.state = State.SUCCESS;
    this.dispatchEvent(EventType.EXECUTED);
    return true;
  }

  /**
   * Set the error state.
   *
   * @param {string} msg The error message.
   * @return {boolean}
   * @protected
   */
  handleError(msg) {
    var eventType = this.state == State.REVERTING ? EventType.REVERTED :
      EventType.EXECUTED;

    this.state = State.ERROR;
    this.details = msg;
    this.dispatchEvent(eventType);
    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.READY;
    this.details = null;
    this.dispatchEvent(EventType.REVERTED);
    return true;
  }
}

exports = AbstractAsyncCommand;
