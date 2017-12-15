goog.provide('os.data.DeactivateDescriptor');

goog.require('goog.events.Event');
goog.require('goog.log');
goog.require('os.command.EventType');
goog.require('os.command.State');
goog.require('os.data.AbstractDescriptor');



/**
 * Command to deactivate a descriptor.
 * @param {!os.data.IDataDescriptor} descriptor The descriptor
 * @extends {os.data.AbstractDescriptor}
 * @constructor
 */
os.data.DeactivateDescriptor = function(descriptor) {
  os.data.DeactivateDescriptor.base(this, 'constructor', descriptor);
  this.log = os.data.DeactivateDescriptor.LOGGER_;

  var type = descriptor.getType();
  this.title = 'Remove ' + (type ? type + ' ' : '') + '"' + descriptor.getTitle() + '"';
};
goog.inherits(os.data.DeactivateDescriptor, os.data.AbstractDescriptor);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.DeactivateDescriptor.LOGGER_ = goog.log.getLogger('os.data.DeactivateDescriptor');


/**
 * @inheritDoc
 */
os.data.DeactivateDescriptor.prototype.execute = function() {
  if (this.canExecute()) {
    this.state = os.command.State.EXECUTING;
    return this.deactivateDescriptor();
  }

  return false;
};


/**
 * @inheritDoc
 */
os.data.DeactivateDescriptor.prototype.revert = function() {
  this.state = os.command.State.REVERTING;
  return this.activateDescriptor();
};


/**
 * @inheritDoc
 */
os.data.DeactivateDescriptor.prototype.onActivated = function(opt_event) {
  this.removeListeners();
  this.state = os.command.State.READY;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.REVERTED));
};


/**
 * @inheritDoc
 */
os.data.DeactivateDescriptor.prototype.onDeactivated = function(opt_event) {
  this.removeListeners();
  this.state = os.command.State.SUCCESS;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
};
