goog.provide('os.command.CommandEvent');
goog.require('goog.events.Event');
goog.require('os.command.EventType');



/**
 * @extends {goog.events.Event}
 * @constructor
 * @param {os.command.EventType} type the event type
 * @param {os.command.ICommand} command The command
 * @param {Object=} opt_target
 * Reference to the object that is the target of this event
 */
os.command.CommandEvent = function(type, command, opt_target) {
  os.command.CommandEvent.base(this, 'constructor', type, opt_target);
  this.command_ = command;
};
goog.inherits(os.command.CommandEvent, goog.events.Event);


/**
 * @private
 * @type {os.command.ICommand}
 */
os.command.CommandEvent.prototype.command_ = null;


/**
 * @return {os.command.ICommand}
 */
os.command.CommandEvent.prototype.getCommand = function() {
  return this.command_;
};
