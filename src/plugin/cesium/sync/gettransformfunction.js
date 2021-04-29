goog.module('plugin.cesium.sync.getTransformFunction');

const olProj = goog.require('ol.proj');
const Projection = goog.requireType('ol.proj.Projection');
const osMap = goog.require('os.map');
const osProj = goog.require('os.proj');


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
exports = () => {
  const pFrom = osMap.PROJECTION;

  if (lastProjection !== pFrom) {
    const pTo = olProj.get(osProj.EPSG4326);
    if (olProj.equivalent(pTo, pFrom)) {
      olTransform = null;
    } else {
      olTransform = olProj.getTransform(pFrom, pTo);
    }

    lastProjection = pFrom;
  }

  return olTransform ? transformFunction : null;
};

