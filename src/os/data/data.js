goog.module('os.data');
goog.module.declareLegacyNamespace();

const {instanceOf} = goog.require('os.classRegistry');

/**
 * Descriptor class names used with os.classRegistry.
 * @type {Object}
 */
const DescriptorClass = {
  LAYER_SYNC: 'os.data.LayerSyncDescriptor'
};

/**
 * Node class names used with os.classRegistry.
 * @type {Object}
 */
const NodeClass = {
  LAYER: 'os.data.LayerNode'
};

/**
 * Settings keys for data providers.
 * @enum {string}
 */
const ProviderKey = {
  ADMIN: 'providers',
  USER: 'userProviders'
};

/**
 * Check if an item is a layer node.
 * @param {*} item The item.
 * @return {boolean}
 */
const isLayerNode = (item) => instanceOf(item, NodeClass.LAYER);

exports = {
  DescriptorClass,
  NodeClass,
  ProviderKey,
  isLayerNode
};
