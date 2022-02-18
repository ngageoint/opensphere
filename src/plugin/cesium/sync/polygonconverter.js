goog.declareModuleId('plugin.cesium.sync.PolygonConverter');

import {GeometryInstanceId} from '../cesium.js';
import LineStringConverter from './linestringconverter.js';
import {createAndAddPolygon} from './polygon.js';
import {getColor} from './style.js';


/**
 * Converter for Polygons
 * @extends {LineStringConverter<Polygon, Cesium.Primitive>}
 */
export default class PolygonConverter extends LineStringConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createAndAddPolygon(feature, geometry, style, context);
    return true;
  }


  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    if (this.isFillBeingAdded(style, context, primitive)) {
      return false;
    }

    return this.updateInternal(feature, geometry, style, context, primitive);
  }


  /**
   * @param {!Feature} feature
   * @param {!Geometry} geometry
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {!Cesium.Primitive} primitive
   * @return {boolean}
   * @protected
   */
  updateInternal(feature, geometry, style, context, primitive) {
    if (Array.isArray(primitive)) {
      for (let i = 0, n = primitive.length; i < n; i++) {
        if (!this.updateInternal(feature, geometry, style, context, primitive[i])) {
          return false;
        }
      }

      return true;
    }

    if (this.isFillBeingRemoved(style, context, primitive)) {
      // leave it dirty so it will be removed
      return true;
    }

    return super.update(feature, geometry, style, context, primitive);
  }


  /**
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {!Array<!Cesium.Primitive>|!Cesium.Primitive} primitive
   * @return {boolean}
   */
  isFillBeingAdded(style, context, primitive) {
    const styleHasFill = style.getFill() ? getColor(style, context, GeometryInstanceId.GEOM).alpha > 0 : false;
    const primitiveHasFill = Array.isArray(primitive) ? primitive.some(isPolygonFill) : isPolygonFill(primitive);
    return styleHasFill && !primitiveHasFill;
  }


  /**
   * @param {!Style} style
   * @param {!VectorContext} context
   * @param {!Cesium.Primitive} primitive
   * @return {boolean}
   */
  isFillBeingRemoved(style, context, primitive) {
    if (isPolygonFill(primitive)) {
      return style.getFill() ? getColor(style, context, GeometryInstanceId.GEOM).alpha === 0 : true;
    }
    return false;
  }
}


/**
 * @param {!Cesium.Primitive} primitive
 * @return {boolean}
 */
const isPolygonFill = (primitive) => primitive['olLineWidth'] == null;
