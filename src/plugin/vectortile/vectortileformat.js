goog.module('plugin.vectortile.format');

const MVT = goog.require('ol.format.MVT');

const FeatureFormat = goog.requireType('ol.format.Feature');


/**
 * Supported Vector Tile formats.
 * @enum {string}
 */
const VectorTileFormat = {
  MVT: 'mvt'
};


/**
 * Get a Vector Tile format object from a type.
 * @param {VectorTileFormat} type The type.
 * @return {!FeatureFormat} [description]
 */
const getVectorTileFormat = (type) => {
  let format;

  switch (type) {
    case VectorTileFormat.MVT:
    default:
      // MVT is Geoserver's preferred production format and most widely supported, so use it as the default.
      format = new MVT();
      break;
  }

  return format;
};

exports = {
  VectorTileFormat,
  getVectorTileFormat
};
