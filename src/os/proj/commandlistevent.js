goog.declareModuleId('os.proj.switch.CommandListEvent');

const GoogEvent = goog.require('goog.events.Event');
const GoogEventType = goog.require('goog.events.EventType');
const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 */
export default class CommandListEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {Array<ICommand>} commands
   */
  constructor(commands) {
    super(CommandListEvent.TYPE);

    /**
     * @type {Array<ICommand>} commands
     */
    this.commands = commands;
  }
}

/**
 * @type {string}
 * @const
 */
CommandListEvent.TYPE = GoogEventType.SUBMIT;
