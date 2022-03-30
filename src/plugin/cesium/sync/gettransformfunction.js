goog.declareModuleId('plugin.cesium.sync.getTransformFunction');

import {get, equivalent, getTransform} from 'ol/src/proj.js';

import {PROJECTION} from '../../../os/map/map.js';
import * as osProj from '../../../os/proj/proj.js';


/**
 * @type {Projection|null}
 */
let lastProjection = null;


/**
 * @type {ol.TransformFunction|null}
 */
let olTransform = null;


/**
 * Openlayers doesn't copy the rest of the coordinate into the result
 * after transforming x and y.
 *
 * @type {ol.TransformFunction}
 */
const transformFunction = (coord, opt_output, opt_dimensions) => {
  const dimension = opt_dimensions == undefined ? coord.length : opt_dimensions;
  const result = olTransform(coord, opt_output, dimension);

  if (opt_output) {
    opt_output.length = dimension;
    for (let i = 2; i < dimension; i++) {
      result[i] = coord[i];
    }
  }

  return result;
};


/**
 * Gets the transform function
 *
 * @return {ol.TransformFunction|null}
 */
export const getTransformFunction = () => {
  const pFrom = PROJECTION;

  if (lastProjection !== pFrom) {
    const pTo = get(osProj.EPSG4326);
    if (equivalent(pTo, pFrom)) {
      olTransform = null;
    } else {
      olTransform = getTransform(pFrom, pTo);
    }

    lastProjection = pFrom;
  }

  return olTransform ? transformFunction : null;
};
