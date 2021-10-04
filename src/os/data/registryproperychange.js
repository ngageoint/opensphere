goog.declareModuleId('os.data.RegistryPropertyChange');

/**
 * @enum {string}
 */
const PropertyChange = {
  ADD: 'registry:add',
  CLEAR: 'registry:clear',
  REMOVE: 'registry:remove',
  UPDATE: 'registry:update'
};

export default PropertyChange;
