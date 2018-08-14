goog.provide('os.command.ICommand');



/**
 * The interface that should be implemented by all commands.
 * @interface
 */
os.command.ICommand = function() {};


/**
 * Executes the command.
 * @return {boolean} <code>true</code> if successful, <code>false</code> otherwise
 */
os.command.ICommand.prototype.execute;


/**
 * Revert the command and reset the complete and successful flags.
 * @return {boolean} <code>true</code> if successful, <code>false</code> otherwise
 */
os.command.ICommand.prototype.revert;


/**
 * Return the current state of the command.
 * @type {!os.command.State}
 */
os.command.ICommand.prototype.state;


/**
 * Whether or not the command is asynchronous. If this is <code>true</code>,
 * then the command should also implement {@link goog.events.Listenable}.
 * This is generally accomplished by inheriting from
 * {@link goog.events.EventTarget}.
 * @type {boolean}
 */
os.command.ICommand.prototype.isAsync;


/**
 * The title of the command
 * @type {?string}
 */
os.command.ICommand.prototype.title;


/**
 * The details of the command
 * @type {?string}
 */
os.command.ICommand.prototype.details;
