goog.provide('plugin.basemap');
goog.require('os.layer.Tile');


/**
 * @type {string}
 * @const
 */
plugin.basemap.ID = 'basemap';


/**
 * @type {string}
 * @const
 */
plugin.basemap.TERRAIN_ID = 'terrain';


/**
 * @type {string}
 * @const
 */
plugin.basemap.LAYER_TYPE = 'Map Layers';


/**
 * @type {string}
 * @const
 */
plugin.basemap.TYPE = 'basemap';


/**
 * @type {string}
 * @const
 */
plugin.basemap.TERRAIN_TYPE = 'terrain';


/**
 * @param {!ol.layer.Layer} layer
 * @return {boolean} Whether or not the layer belongs in the base map group
 */
plugin.basemap.isBaseMap = function(layer) {
  return layer instanceof os.layer.Tile &&
      /** @type {os.layer.Tile} */ (layer).getOSType() == plugin.basemap.LAYER_TYPE;
};
