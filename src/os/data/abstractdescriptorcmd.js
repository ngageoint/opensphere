goog.provide('os.data.AbstractDescriptor');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.events.Event');
goog.require('goog.events.EventTarget');
goog.require('goog.events.EventType');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.command.EventType');
goog.require('os.command.ICommand');
goog.require('os.command.State');
goog.require('os.data.DescriptorEventType');
goog.require('os.data.IDataDescriptor');
goog.require('os.events.EventType');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');



/**
 * Abstract command for activating/deactivating descriptors.
 * @param {!os.data.IDataDescriptor} descriptor The descriptor
 * @implements {os.command.ICommand}
 * @extends {goog.events.EventTarget}
 * @constructor
 */
os.data.AbstractDescriptor = function(descriptor) {
  os.data.AbstractDescriptor.base(this, 'constructor');
  this.isAsync = true;
  this.title = 'Activate/Deactivate Descriptor';
  this.details = null;
  this.state = os.command.State.READY;

  /**
   * The descriptor ID
   * @type {string}
   * @protected
   */
  this.id = descriptor.getId();

  /**
   * @type {goog.log.Logger}
   * @protected
   */
  this.log = os.data.AbstractDescriptor.LOGGER_;
};
goog.inherits(os.data.AbstractDescriptor, goog.events.EventTarget);


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.data.AbstractDescriptor.LOGGER_ = goog.log.getLogger('os.data.AbstractDescriptor');


/**
 * @inheritDoc
 */
os.data.AbstractDescriptor.prototype.execute = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.data.AbstractDescriptor.prototype.revert = goog.abstractMethod;


/**
 * @inheritDoc
 */
os.data.AbstractDescriptor.prototype.disposeInternal = function() {
  os.data.AbstractDescriptor.base(this, 'disposeInternal');
  this.removeListeners();
};


/**
 * Get the descriptor by id.
 * @return {os.data.IDataDescriptor}
 */
os.data.AbstractDescriptor.prototype.getDescriptor = function() {
  return this.id ? os.dataManager.getDescriptor(this.id) : null;
};


/**
 * Checks if the command is ready to execute.
 * @return {boolean}
 */
os.data.AbstractDescriptor.prototype.canExecute = function() {
  if (this.state !== os.command.State.READY) {
    this.details = 'Command not in ready state.';
    return false;
  }

  if (!this.getDescriptor()) {
    this.state = os.command.State.ERROR;
    this.details = 'Descriptor unavailable.';
    return false;
  }

  return true;
};


/**
 * Activates the descriptor.
 * @return {boolean} If the operation was successful
 * @protected
 */
os.data.AbstractDescriptor.prototype.activateDescriptor = function() {
  try {
    var descriptor = this.getDescriptor();
    if (descriptor && !descriptor.isActive()) {
      descriptor.listenOnce(os.data.DescriptorEventType.ACTIVATED, this.onActivated, false, this);
      descriptor.listenOnce(os.data.DescriptorEventType.DEACTIVATED, this.onActivationError, false, this);
      descriptor.setActive(true);
      os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.ADD_LAYER_COMMAND, 1);
    } else {
      this.onActivated();
    }
  } catch (e) {
    goog.log.error(this.log, 'Unable to activate descriptor: ' + e.message, e);
    this.removeListeners();
    this.state = os.command.State.ERROR;

    return false;
  }

  return true;
};


/**
 * Deactivates the descriptor.
 * @return {boolean} If the operation was successful
 * @protected
 */
os.data.AbstractDescriptor.prototype.deactivateDescriptor = function() {
  var descriptor = this.getDescriptor();
  if (descriptor && descriptor.isActive()) {
    descriptor.listenOnce(os.data.DescriptorEventType.DEACTIVATED, this.onDeactivated, false, this);
    descriptor.setActive(false);
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.AddData.REMOVE_LAYER_COMMAND, 1);
  } else {
    this.onDeactivated();
  }

  return true;
};


/**
 * Callback for the descriptor's activation event.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.data.AbstractDescriptor.prototype.onActivated = goog.abstractMethod;


/**
 * Callback for the descriptor's deactivation event.
 * @param {goog.events.Event=} opt_event
 * @protected
 */
os.data.AbstractDescriptor.prototype.onDeactivated = goog.abstractMethod;


/**
 * Removes the listeners created by this command
 * @protected
 */
os.data.AbstractDescriptor.prototype.removeListeners = function() {
  var descriptor = this.getDescriptor();
  if (descriptor) {
    descriptor.unlisten(os.data.DescriptorEventType.ACTIVATED, this.onActivated, false, this);
    descriptor.unlisten(os.data.DescriptorEventType.DEACTIVATED, this.onDeactivated, false, this);
    descriptor.unlisten(os.data.DescriptorEventType.DEACTIVATED, this.onActivationError, false, this);
  }
};


/**
 * Handles errors in activating the descriptor.
 * @protected
 */
os.data.AbstractDescriptor.prototype.onActivationError = function() {
  this.removeListeners();
  this.state = os.command.State.ERROR;
  this.dispatchEvent(new goog.events.Event(os.command.EventType.EXECUTED));
};
