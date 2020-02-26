goog.module('plugin.cesium.sync.PolygonConverter');

const {createAndAddPolygon} = goog.require('plugin.cesium.sync.polygon');
const LineStringConverter = goog.require('plugin.cesium.sync.LineStringConverter');


/**
 * Converter for Polygons
 */
class PolygonConverter extends LineStringConverter {
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
    if (Array.isArray(primitive)) {
      for (let i = 0, n = primitive.length; i < n; i++) {
        if (!super.update(feature, geometry, style, context, primitive[i])) {
          return false;
        }
      }
      return true;
    }

    return super.update(feature, geometry, style, context, primitive);
  }
}


exports = PolygonConverter;
