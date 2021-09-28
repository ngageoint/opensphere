goog.declareModuleId('os.command.CommandEvent');

const GoogEvent = goog.require('goog.events.Event');

const {default: EventType} = goog.requireType('os.command.EventType');


/**
 * Reference to the object that is the target of this event
 */
export default class CommandEvent extends GoogEvent {
  /**
   * Constructor.
   * @param {EventType} type the event type
   * @param {os.command.ICommand} command The command
   * @param {Object=} opt_target
   */
  constructor(type, command, opt_target) {
    super(type, opt_target);

    /**
     * @private
     * @type {os.command.ICommand}
     */
    this.command_ = command;
  }

  /**
   * @return {os.command.ICommand}
   */
  getCommand() {
    return this.command_;
  }
}
