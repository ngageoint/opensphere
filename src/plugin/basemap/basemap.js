goog.module('plugin.basemap');

const Tile = goog.require('os.layer.Tile');

const Layer = goog.requireType('ol.layer.Layer');


/**
 * @type {string}
 */
const ID = 'basemap';

/**
 * @type {string}
 */
const TERRAIN_ID = 'terrain';

/**
 * @type {string}
 */
const LAYER_TYPE = 'Map Layers';

/**
 * @type {string}
 */
const TYPE = 'basemap';

/**
 * @type {string}
 */
const TERRAIN_TYPE = 'terrain';

/**
 * @param {!Layer} layer
 * @return {boolean} Whether or not the layer belongs in the base map group
 */
const isBaseMap = function(layer) {
  return layer instanceof Tile && /** @type {Tile} */ (layer).getOSType() == LAYER_TYPE;
};

exports = {
  ID,
  TERRAIN_ID,
  LAYER_TYPE,
  TYPE,
  TERRAIN_TYPE,
  isBaseMap
};
