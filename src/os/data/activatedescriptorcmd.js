goog.provide('os.data.ActivateDescriptor');

goog.require('goog.events.Event');
goog.require('goog.log');
goog.require('os.command.EventType');
goog.require('os.command.State');
goog.require('os.data.AbstractDescriptor');



/**
 * Command to activate a descriptor.
 * @param {!os.data.IDataDescriptor} descriptor The descriptor
 * @extends {os.data.AbstractDescriptor}
 * @constructor
 */
os.data.ActivateDescriptor = function(descriptor) {
  os.data.ActivateDescriptor.base(this, 'constructor', descriptor);
  this.log = os.data.ActivateDescriptor.LOGGER_;

  var type = descriptor.getType();
  this.title = 'Add ' + (type ? type + ' ' : '') + '"' + descriptor.getTitle() + '"';
};
goog.inherits(os.data.ActivateDescriptor, os.data.AbstractDescriptor);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.ActivateDescriptor.LOGGER_ = goog.log.getLogger('os.data.ActivateDescriptor');


/**
 * @inheritDoc
 */
os.data.ActivateDescriptor.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    return this.activateDescriptor();
  }

  return false;
};


/**
 * @inheritDoc
 */
os.data.ActivateDescriptor.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  return this.deactivateDescriptor();
};


/**
 * @inheritDoc
 */
os.data.ActivateDescriptor.prototype.onActivated = function(opt_event) {
  this.removeListeners();
  this.state = os.command.State.SUCCESS;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
};


/**
 * @inheritDoc
 */
os.data.ActivateDescriptor.prototype.onDeactivated = function(opt_event) {
  this.removeListeners();
  this.state = os.command.State.READY;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
};
