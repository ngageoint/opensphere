goog.declareModuleId('plugin.cesium.sync.EllipsoidConverter');

import {createEllipsoid} from './ellipsoid.js';
import PolygonConverter from './polygonconverter.js';

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
