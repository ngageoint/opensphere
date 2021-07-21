goog.module('os.proj.switch.CommandListEvent');
goog.module.declareLegacyNamespace();

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');

/**
 */
class CommandListEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {Array<os.command.ICommand>} commands
   */
  constructor(commands) {
    super(CommandListEvent.TYPE);

    /**
     * @type {Array<os.command.ICommand>} commands
     */
    this.commands = commands;
  }
}

/**
 * @type {string}
 * @const
 */
CommandListEvent.TYPE = GoogEventType.SUBMIT;

exports = CommandListEvent;
