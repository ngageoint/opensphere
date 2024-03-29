goog.declareModuleId('os.command.AbstractSyncCommand');

import State from './state.js';

const Disposable = goog.require('goog.Disposable');

const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Abstract synchronous command implementation.
 *
 * @abstract
 * @implements {ICommand}
 */
export default class AbstractSyncCommand extends Disposable {
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
    this.isAsync = false;

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
    this.state = State.ERROR;
    this.details = msg;
    return false;
  }

  /**
   * @inheritDoc
   */
  revert() {
    this.state = State.READY;
    this.details = null;
    return true;
  }
}
