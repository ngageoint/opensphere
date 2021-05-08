goog.module('plugin.cesium.sync.DynamicPolygonConverter');

const BaseConverter = goog.require('plugin.cesium.sync.BaseConverter');
const {createOrUpdateSegment} = goog.require('plugin.cesium.sync.DynamicLineString');

const Feature = goog.requireType('ol.Feature');
const Geometry = goog.requireType('ol.geom.Geometry');
const Polygon = goog.requireType('ol.geom.Polygon');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * Converter for DynamicFeature polygons.
 * @extends {BaseConverter<(Polygon), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
class DynamicPolygonConverter extends BaseConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createOrUpdatePolygon(feature, geometry, style, context);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    createOrUpdatePolygon(feature, geometry, style, context, Array.isArray(primitive) ? primitive : [primitive]);
    return true;
  }
}


/**
 * Creates or updates a polygon geometry as a Cesium.Polyline.
 * @param {!Feature} feature
 * @param {!Polygon} polygon
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.Polyline>=} opt_primitives
 */
const createOrUpdatePolygon = (feature, polygon, style, context, opt_primitives) => {
  const flatCoords = polygon.getFlatCoordinates();
  const ends = polygon.getEnds();
  let offset = 0;

  ends.forEach((end, i) => {
    createOrUpdateSegment(i, feature, polygon, style, context, flatCoords, offset, end, opt_primitives);
    offset = end;
  });
};


exports = DynamicPolygonConverter;
