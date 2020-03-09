goog.module('plugin.cesium.sync.PolygonConverter');

const {GeometryInstanceId} = goog.require('plugin.cesium');
const {createAndAddPolygon} = goog.require('plugin.cesium.sync.polygon');
const LineStringConverter = goog.require('plugin.cesium.sync.LineStringConverter');
const {getColor} = goog.require('plugin.cesium.sync.style');

const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


/**
 * Converter for Polygons
 */
class PolygonConverter extends LineStringConverter {
  /**
   *
   */
  constructor() {
    super();

    /**
     * @private
     */
    this.isRoot_ = true;
  }

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
    if (this.isRoot_ && isFillBeingAdded(style, context, primitive)) {
      return false;
    }

    if (Array.isArray(primitive)) {
      this.isRoot_ = false;

      for (let i = 0, n = primitive.length; i < n; i++) {
        if (!this.update(feature, geometry, style, context, primitive[i])) {
          return false;
        }
      }

      this.isRoot_ = true;
      return true;
    }

    if (isFillBeingRemoved(style, context, primitive)) {
      // leave it dirty so it will be removed
      return true;
    }

    return super.update(feature, geometry, style, context, primitive);
  }
}


/**
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Array<!Cesium.Primitive>|!Cesium.Primitive} primitive
 * @return {boolean}
 */
const isFillBeingAdded = (style, context, primitive) => {
  const styleHasFill = style.getFill() ? getColor(style, context, GeometryInstanceId.GEOM).alpha > 0 : false;
  let primitiveHasFill = false;

  if (Array.isArray(primitive)) {
    for (let i = 0, n = primitive.length; i < n; i++) {
      if (primitive[i]['olLineWidth'] == null) {
        primitiveHasFill = true;
        break;
      }
    }
  } else {
    primitiveHasFill = primitive['olLineWidth'] == null;
  }

  return styleHasFill && !primitiveHasFill;
};


/**
 * @param {!Style} style
 * @param {!VectorContext} context
 * @param {!Cesium.Primitive} primitive
 * @return {boolean}
 */
const isFillBeingRemoved = (style, context, primitive) => {
  if (primitive['olLineWidth'] == null) {
    return style.getFill() ? getColor(style, context, GeometryInstanceId.GEOM).alpha === 0 : true;
  }
  return false;
};


exports = PolygonConverter;
