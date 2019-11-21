goog.provide('os.extent');
goog.require('os.geo2');


/**
 * Clamp an extent within a range.
 *
 * @param {ol.Extent} extent The extent to clamp.
 * @param {ol.Extent} clampTo The clamping extent.
 * @param {ol.Extent=} opt_extent Optional extent to save the result into.
 * @return {ol.Extent} The clamped extent.
 */
os.extent.clamp = function(extent, clampTo, opt_extent) {
  var result = opt_extent || [];
  result[0] = goog.math.clamp(extent[0], clampTo[0], clampTo[2]);
  result[1] = goog.math.clamp(extent[1], clampTo[1], clampTo[3]);
  result[2] = goog.math.clamp(extent[2], clampTo[0], clampTo[2]);
  result[3] = goog.math.clamp(extent[3], clampTo[1], clampTo[3]);
  return result;
};


/**
 * @param {ol.Extent} extent
 * @param {ol.ProjectionLike=} opt_proj
 * @return {boolean} Whether or not the extent crosses the antimeridian
 */
os.extent.crossesAntimeridian = function(extent, opt_proj) {
  if (!extent || ol.extent.isEmpty(extent)) {
    return false;
  }

  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
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
os.extent.normalizeAntiRight = function(extent, opt_proj, opt_result) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
  var projExtent = opt_proj.getExtent();
  var left = projExtent[0];
  var right = projExtent[2];
  var width = right - left;
  var min = left + width / 2;
  var max = min + width;
  return os.extent.normalize(extent, min, max, opt_proj, opt_result);
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
os.extent.normalizeAntiLeft = function(extent, opt_proj, opt_result) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
  var projExtent = opt_proj.getExtent();
  var left = projExtent[0];
  var right = projExtent[2];
  var width = right - left;
  var min = left - width / 2;
  var max = min + width;
  return os.extent.normalize(extent, min, max, opt_proj, opt_result);
};


/**
 * @param {ol.Extent} extent
 * @param {number} center
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
os.extent.normalizeToCenter = function(extent, center, opt_proj, opt_result) {
  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);

  var projExtent = opt_proj.getExtent();
  var halfWidth = (projExtent[2] - projExtent[0]) / 2;

  return os.extent.normalize(extent, center - halfWidth, center + halfWidth, opt_proj, opt_result);
};


/**
 * @param {ol.Extent} extent
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.ProjectionLike=} opt_proj
 * @param {ol.Extent=} opt_result
 * @return {ol.Extent}
 */
os.extent.normalize = function(extent, opt_min, opt_max, opt_proj, opt_result) {
  opt_result = opt_result || extent.slice();
  opt_result[1] = extent[1];
  opt_result[3] = extent[3];

  var extentWidth = extent[2] - extent[0];

  opt_proj = ol.proj.get(opt_proj || os.map.PROJECTION);
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
    var lon1 = os.geo2.normalizeLongitude(extent[0], opt_min, opt_max, opt_proj);
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
 * @param {?ol.geom.Geometry} geom The geom
 * @return {?ol.Extent} the extent
 */
os.extent.getFunctionalExtent = function(geom) {
  if (!geom) {
    return null;
  }

  var proj = os.map.PROJECTION;
  var extent = geom.getExtent();
  var result = extent;

  if (proj.canWrapX()) {
    var extentWidth = ol.extent.getWidth(extent);
    var antiExtent = geom.getAntiExtent();
    var antiExtentWidth = ol.extent.getWidth(antiExtent);

    result = antiExtentWidth + os.geo.EPSILON < extentWidth ? antiExtent : extent;
  }

  return result;
};
