goog.declareModuleId('plugin.cesium.sync.DynamicMultiPolygonConverter');

import BaseConverter from './baseconverter.js';
import {createOrUpdateSegment} from './dynamiclinestring.js';


/**
 * Converter for DynamicFeature MultiPolygons.
 * @extends {BaseConverter<(MultiPolygon), (Cesium.Polyline|Cesium.PolylineOptions)>}
 */
export default class DynamicMultiPolygonConverter extends BaseConverter {
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
