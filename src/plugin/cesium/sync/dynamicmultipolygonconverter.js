goog.module('plugin.cesium.sync.DynamicMultiPolygonConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {createOrUpdateSegment} = goog.require('plugin.cesium.sync.DynamicLineString');

const Feature = goog.requireType('ol.Feature');
const MultiPolygon = goog.requireType('ol.geom.MultiPolygon');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * Converter for DynamicFeature MultiPolygons.
 * @extends {BaseConverter<(MultiPolygon), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
class DynamicMultiPolygonConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createOrUpdateMultiPolygon(feature, geometry, style, context);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    createOrUpdateMultiPolygon(feature, geometry, style, context, Array.isArray(primitive) ? primitive : [primitive]);
    return true;
  }
}


/**
 * Creates or updates a MultiPolygon geometry as a Cesium.Polyline.
 * @param {!Feature} feature
 * @param {!MultiPolygon} multipolygon
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {Array<!Cesium.Polyline>=} opt_primitives
 */
const createOrUpdateMultiPolygon = (feature, multipolygon, style, context, opt_primitives) => {
  const flatCoords = multipolygon.getFlatCoordinates();
  const endss = multipolygon.getEndss();
  let offset = 0;

  endss.forEach((ends) => {
    ends.forEach((end, i) => {
      createOrUpdateSegment(i, feature, multipolygon, style, context, flatCoords, offset, end, opt_primitives);
      offset = end;
    });
  });
};


exports = DynamicMultiPolygonConverter;
