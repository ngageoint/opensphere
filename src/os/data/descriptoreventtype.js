goog.declareModuleId('os.data.DescriptorEventType');

/**
 * @enum {string}
 */
const DescriptorEventType = {
  ADD_DESCRIPTOR: 'addDescriptor',
  REMOVE_DESCRIPTOR: 'removeDescriptor',
  UPDATE_DESCRIPTOR: 'updateDescriptor',
  USER_TOGGLED: 'userToggledDescriptor',
  ACTIVATED: 'descriptorActivated',
  DEACTIVATED: 'descriptorDeactivated'
};

export default DescriptorEventType;
