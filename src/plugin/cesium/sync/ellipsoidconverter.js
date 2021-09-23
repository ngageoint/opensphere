goog.declareModuleId('plugin.cesium.sync.EllipsoidConverter');

const PolygonConverter = goog.require('plugin.cesium.sync.PolygonConverter');
const {createEllipsoid} = goog.require('plugin.cesium.sync.ellipsoid');


/**
 * Converter for Ellipsoids
 */
export default class EllipsoidConverter extends PolygonConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createEllipsoid(feature, geometry, style, context);
    return true;
  }
}
