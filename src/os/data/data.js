goog.declareModuleId('os.data');

import {instanceOf} from '../classregistry.js';


/**
 * Descriptor class names used with os.classRegistry.
 * @type {Object}
 */
export const DescriptorClass = {
  LAYER_SYNC: 'os.data.LayerSyncDescriptor'
};

/**
 * Node class names used with os.classRegistry.
 * @type {Object}
 */
export const NodeClass = {
  DRAW_FEATURE: 'os.data.DrawingFeatureNode',
  DRAW_LAYER: 'os.data.DrawingLayerNode',
  LAYER: 'os.data.LayerNode',
  SLICK: 'os.ui.slick.SlickTreeNode'
};

/**
 * Settings keys for data providers.
 * @enum {string}
 */
export const ProviderKey = {
  ADMIN: 'providers',
  USER: 'userProviders'
};

/**
 * Check if an item is a layer node.
 * @param {*} item The item.
 * @return {boolean}
 */
export const isLayerNode = (item) => instanceOf(item, NodeClass.LAYER);
