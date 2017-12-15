goog.provide('os.data.DescriptorEvent');
goog.provide('os.data.DescriptorEventType');

goog.require('goog.events.Event');


/**
 * @enum {string}
 */
os.data.DescriptorEventType = {
  ADD_DESCRIPTOR: 'addDescriptor',
  REMOVE_DESCRIPTOR: 'removeDescriptor',
  UPDATE_DESCRIPTOR: 'updateDescriptor',
  USER_TOGGLED: 'userToggledDescriptor',
  ACTIVATED: 'descriptorActivated',
  DEACTIVATED: 'descriptorDeactivated'
};



/**
 * @param {string} type
 * @param {os.data.IDataDescriptor=} opt_descriptor
 * @param {os.data.IDataDescriptor=} opt_descriptor2
 * @extends {goog.events.Event}
 * @constructor
 */
os.data.DescriptorEvent = function(type, opt_descriptor, opt_descriptor2) {
  os.data.DescriptorEvent.base(this, 'constructor', type);

  /**
   * @type {?os.data.IDataDescriptor}
   */
  this.descriptor = opt_descriptor || null;

  /**
   * @type {?os.data.IDataDescriptor}
   */
  this.descriptor2 = opt_descriptor2 || null;
};
goog.inherits(os.data.DescriptorEvent, goog.events.Event);
