goog.module('os.data');

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
  DRAW_FEATURE: 'os.data.DrawingFeatureNode',
  DRAW_LAYER: 'os.data.DrawingLayerNode',
  LAYER: 'os.data.LayerNode',
  SLICK: 'os.ui.slick.SlickTreeNode'
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
