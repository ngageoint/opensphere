goog.module('plugin.cesium.sync.EllipsoidConverter');

const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');
const {createEllipsoid} = goog.require('plugin.cesium.sync.ellipsoid');


/**
 * Converter for Ellipsoids
 */
class EllipsoidConverter extends PolygonConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    const primitive = createEllipsoid(feature, geometry, style, context);
    context.addPrimitive(primitive, feature, geometry);
    return true;
  }
}


exports = EllipsoidConverter;

