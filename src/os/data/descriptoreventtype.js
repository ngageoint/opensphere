goog.module('os.data.DescriptorEventType');

/**
 * @enum {string}
 */
exports = {
  ADD_DESCRIPTOR: 'addDescriptor',
  REMOVE_DESCRIPTOR: 'removeDescriptor',
  UPDATE_DESCRIPTOR: 'updateDescriptor',
  USER_TOGGLED: 'userToggledDescriptor',
  ACTIVATED: 'descriptorActivated',
  DEACTIVATED: 'descriptorDeactivated'
};
