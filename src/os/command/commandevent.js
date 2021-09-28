goog.declareModuleId('os.command.CommandEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: EventType} = goog.requireType('os.command.EventType');
const {default: ICommand} = goog.requireType('os.command.ICommand');


/**
 * Reference to the object that is the target of this event
 */
export default class CommandEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {EventType} type the event type
   * @param {ICommand} command The command
   * @param {Object=} opt_target
   */
  constructor(type, command, opt_target) {
    super(type, opt_target);

    /**
     * @private
     * @type {ICommand}
     */
    this.command_ = command;
  }

  /**
   * @return {ICommand}
   */
  getCommand() {
    return this.command_;
  }
}
