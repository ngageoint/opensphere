goog.declareModuleId('plugin.cesium.sync.DynamicPolygonConverter');

import BaseConverter from './baseconverter.js';
import {createOrUpdateSegment} from './dynamiclinestring.js';


/**
 * Converter for DynamicFeature polygons.
 * @extends {BaseConverter<(Polygon), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
export default class DynamicPolygonConverter extends BaseConverter {
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
