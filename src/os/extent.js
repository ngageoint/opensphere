goog.module('os.extent');
goog.module.declareLegacyNamespace();

const math = goog.require('goog.math');
const olExtent = goog.require('ol.extent');
const olProj = goog.require('ol.proj');
const geo2 = goog.require('os.geo2');
const osMap = goog.require('os.map');

/**
 * @type {number}
 */
const EPSILON = 1E-12;

/**
 * Clamp an extent within a range.
 *
 * @param {ol.Extent} extent The extent to clamp.
 * @param {ol.Extent} clampTo The clamping extent.
 * @param {ol.Extent=} opt_extent Optional extent to save the result into.
 * @return {ol.Extent} The clamped extent.
 */
const clamp = function(extent, clampTo, opt_extent) {
  var result = opt_extent || [];
  result[0] = math.clamp(extent[0], clampTo[0], clampTo[2]);
  result[1] = math.clamp(extent[1], clampTo[1], clampTo[3]);
  result[2] = math.clamp(extent[2], clampTo[0], clampTo[2]);
  result[3] = math.clamp(extent[3], clampTo[1], clampTo[3]);
  return result;
};

/**
 * @param {ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @return {boolean} Whether or not the extent crosses the antimeridian
 */
const crossesAntimeridian = function(extent, opt_proj) {
  if (!extent || olExtent.isEmpty(extent)) {
    return false;
  }

  opt_proj = olProj.get(opt_proj || osMap.PROJECTION);
  if (opt_proj.canWrapX()) {
    var projExtent = opt_proj.getExtent();
    var xmin = extent[0];
    var xmax = extent[2];
    var epsilon = opt_proj.getUnits() === 'm' ? 1E-6 : 1E-12;

    var projMin = projExtent[0];
    var projMax = projExtent[2];
    var width = projMax - projMin;

    if (Math.abs(projMin - xmin) < epsilon || Math.abs(projMax - xmax) < epsilon) {
      // touches, but does not cross
      return false;
    }

    var worldsAwayMin = Math.ceil((projMin - xmin) / width);
    var worldsAwayMax = Math.ceil((projMin - xmax) / width);
    return worldsAwayMin !== worldsAwayMax;
  }

  return false;
};

/**
 * Normalizes an extent for a projection where the right antimeridian becomes
 * the meridian.
 *
 * @param {ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
const normalizeAntiRight = function(extent, opt_proj, opt_result) {
  opt_proj = olProj.get(opt_proj || osMap.PROJECTION);
  var projExtent = opt_proj.getExtent();
  var left = projExtent[0];
  var right = projExtent[2];
  var width = right - left;
  var min = left + width / 2;
  var max = min + width;
  return normalize(extent, min, max, opt_proj, opt_result);
};

/**
 * Normalizes an extent for a projection where the left antimeridian becomes
 * the meridian.
 *
 * @param {ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
const normalizeAntiLeft = function(extent, opt_proj, opt_result) {
  opt_proj = olProj.get(opt_proj || osMap.PROJECTION);
  var projExtent = opt_proj.getExtent();
  var left = projExtent[0];
  var right = projExtent[2];
  var width = right - left;
  var min = left - width / 2;
  var max = min + width;
  return normalize(extent, min, max, opt_proj, opt_result);
};

/**
 * @param {ol.Extent} extent
 * @param {number} center
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
const normalizeToCenter = function(extent, center, opt_proj, opt_result) {
  opt_proj = olProj.get(opt_proj || osMap.PROJECTION);

  var projExtent = opt_proj.getExtent();
  var halfWidth = (projExtent[2] - projExtent[0]) / 2;

  return normalize(extent, center - halfWidth, center + halfWidth, opt_proj, opt_result);
};

/**
 * @param {ol.Extent} extent
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
const normalize = function(extent, opt_min, opt_max, opt_proj, opt_result) {
  opt_result = opt_result || extent.slice();
  opt_result[1] = extent[1];
  opt_result[3] = extent[3];

  var extentWidth = extent[2] - extent[0];

  opt_proj = olProj.get(opt_proj || osMap.PROJECTION);
  var projExtent = opt_proj.getExtent();
  opt_min = opt_min != null ? opt_min : projExtent[0];
  opt_max = opt_max != null ? opt_max : projExtent[2];
  var projWidth = opt_max - opt_min;
  var epsilon = opt_proj.getUnits() === 'm' ? 1E-6 : 1E-12;

  if (Math.abs(extentWidth - projWidth) < epsilon) {
    // the width is full-world
    opt_result[0] = opt_min;
    opt_result[2] = opt_max;
  } else {
    var lon1 = geo2.normalizeLongitude(extent[0], opt_min, opt_max, opt_proj);
    var lon2 = lon1 + extentWidth;

    if (lon2 > opt_max - epsilon) {
      lon1 -= projWidth;
      lon2 -= projWidth;
    }

    if (lon1 < opt_min - epsilon) {
      lon1 += projWidth;
      lon2 += projWidth;
    }

    opt_result[0] = lon1;
    opt_result[2] = lon2;
  }

  return opt_result;
};

/**
 * Gets the "functional" extent of the geometry. Geometries that cross the
 * antimeridian have points that give a default extent like [-179.999, 179.999].
 * This is unhelpful for zooming and other extent aggregations. This function
 * produces an extent from longitudes normalized to [0, 360] instead.
 *
 * @param {?(ol.geom.Geometry|ol.Extent)} geomOrExtent The geometry or extent
 * @return {?ol.Extent} the extent
 */
const getFunctionalExtent = function(geomOrExtent) {
  if (Array.isArray(geomOrExtent)) {
    return getFunctionalExtentFromExtent(geomOrExtent);
  }
  return getFunctionalExtentFromGeom(geomOrExtent);
};

/**
 * Gets the "functional" extent of the extent. Extents that cross the
 * antimeridian have points that give a default extent like [-179.999, 179.999].
 * This is unhelpful for zooming and other extent aggregations. This function
 * produces an extent from longitudes normalized to [0, 360] instead.
 *
 * @param {?ol.geom.Geometry} geom The geometry or extent
 * @param {ol.ProjectionLike=} opt_proj
 * @return {?ol.Extent} the extent
 */
const getFunctionalExtentFromGeom = function(geom, opt_proj) {
  if (!geom) {
    return null;
  }

  const proj = olProj.get(opt_proj || osMap.PROJECTION);
  const extent = geom.getExtent();
  let result = extent;

  if (proj.canWrapX()) {
    const antiExtent = geom.getAntiExtent();
    result = getThinnestExtent(extent, antiExtent);
  }

  return result;
};

/**
 * @param {?ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @return {?ol.Extent}
 */
const getFunctionalExtentFromExtent = function(extent, opt_proj) {
  if (!extent) {
    return null;
  }

  const proj = olProj.get(opt_proj || osMap.PROJECTION);
  let result = extent;

  if (proj.canWrapX()) {
    const antiExtent = getInverse(extent, proj);
    result = getThinnestExtent(extent, antiExtent);
  }

  return result;
};

/**
 * @param {ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @return {ol.Extent}
 */
const getInverse = function(extent, opt_proj) {
  const result = extent.slice();
  const proj = olProj.get(opt_proj || osMap.PROJECTION);
  const projExtent = proj.getExtent();
  result[0] += olExtent.getWidth(projExtent);

  const tmp = result[0];
  result[0] = result[2];
  result[2] = tmp;

  return result;
};

/**
 * @param {?ol.Extent} extent1
 * @param {?ol.Extent} extent2
 * @return {?ol.Extent}
 */
const getThinnestExtent = function(extent1, extent2) {
  if (!extent1 || !extent2) {
    return extent1 || extent2;
  }

  const width1 = olExtent.getWidth(extent1);
  const width2 = olExtent.getWidth(extent2);
  return width2 + EPSILON < width1 ? extent2 : extent1;
};

exports = {
  clamp,
  crossesAntimeridian,
  normalizeAntiRight,
  normalizeAntiLeft,
  normalizeToCenter,
  normalize,
  getFunctionalExtent,
  getFunctionalExtentFromGeom,
  getFunctionalExtentFromExtent,
  getInverse,
  getThinnestExtent
};
