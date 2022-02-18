goog.declareModuleId('plugin.basemap');

import Tile from '../../os/layer/tile.js';


/**
 * @type {string}
 */
export const ID = 'basemap';

/**
 * @type {string}
 */
export const TERRAIN_ID = 'terrain';

/**
 * @type {string}
 */
export const LAYER_TYPE = 'Map Layers';

/**
 * @type {string}
 */
export const TYPE = 'basemap';

/**
 * @type {string}
 */
export const TERRAIN_TYPE = 'terrain';

/**
 * @param {!Layer} layer
 * @return {boolean} Whether or not the layer belongs in the base map group
 */
export const isBaseMap = function(layer) {
  return layer instanceof Tile && /** @type {Tile} */ (layer).getOSType() == LAYER_TYPE;
};
