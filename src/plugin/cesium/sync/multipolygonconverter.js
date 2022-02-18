goog.declareModuleId('plugin.cesium.sync.MultiPolygonConverter');

import {createAndAddPolygon} from './polygon.js';
import PolygonConverter from './polygonconverter.js';


/**
 * Converter for MultiPolygons
 * @extends {PolygonConverter<MultiPolygon, Cesium.Primitive>}
 */
export default class MultiPolygonConverter extends PolygonConverter {
  /**
   * @inheritDoc
   */
  create(feature, geometry, style, context) {
    createMultiPolygon(feature, geometry, style, context);
    return true;
  }

  /**
   * @inheritDoc
   */
  update(feature, geometry, style, context, primitive) {
    if (super.isFillBeingAdded(style, context, primitive)) {
      return false;
    }

    for (let i = 0, n = primitive.length; i < n; i++) {
      if (!super.update(feature, geometry, style, context, primitive[i])) {
        return false;
      }
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  isFillBeingAdded(style, context, primitive) {
    return false;
  }
}


/**
 * @param {!Feature} feature
 * @param {!MultiPolygon} multipoly
 * @param {!Style} style
 * @param {!VectorContext} context
 */
const createMultiPolygon = (feature, multipoly, style, context) => {
  const polyFlats = multipoly.getFlatCoordinates();
  const polyEnds = multipoly.getEndss();

  const extrudes = /** @type {Array<boolean>|undefined} */ (multipoly.get('extrude'));
  let offset = 0;

  for (let i = 0, ii = polyEnds.length; i < ii; i++) {
    const ringEnds = polyEnds[i];
    const extrude = extrudes && extrudes.length === polyEnds.length ? extrudes[i] : false;

    createAndAddPolygon(feature, multipoly, style, context, polyFlats, offset,
        ringEnds, extrude, i);

    offset = ringEnds[ringEnds.length - 1];
  }
};
