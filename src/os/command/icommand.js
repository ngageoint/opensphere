goog.module('os.command.ICommand');

const State = goog.requireType('os.command.State');


/**
 * The interface that should be implemented by all commands.
 *
 * @interface
 */
class ICommand {
  /**
   * Constructor.
   */
  constructor() {
    /**
     * Return the current state of the command.
     * @type {!State}
     */
    this.state;

    /**
     * Whether or not the command is asynchronous. If this is true,
     * then the command should also implement {@link goog.events.Listenable}.
     * This is generally accomplished by inheriting from
     * {@link goog.events.EventTarget}.
     * @type {boolean}
     */
    this.isAsync;

    /**
     * The title of the command.
     * @type {?string}
     */
    this.title;

    /**
     * The details of the command.
     * @type {?string}
     */
    this.details;
  }

  /**
   * Executes the command.
   * @return {boolean} true if successful, false otherwise
   */
  execute() {}

  /**
   * Revert the command and reset the complete and successful flags.
   * @return {boolean} true if successful, false otherwise
   */
  revert() {}
}

exports = ICommand;
