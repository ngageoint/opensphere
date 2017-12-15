goog.provide('os.extent');


/**
 * Clamp an extent within a range.
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

  if (proj.getCode() !== os.proj.EPSG4326) {
    geom = geom.clone().toLonLat();
  }

  var extent = geom.getExtent();
  if (geom instanceof ol.geom.SimpleGeometry && os.geo.crossesDateLine(geom)) {
    var min = 360;
    var max = 0;
    var coords = geom.getFlatCoordinates();
    var stride = geom.getStride();

    for (var i = 0, n = coords.length; i < n; i += stride) {
      var lon = os.geo.normalizeLongitude(coords[i], 0, 360);
      min = Math.min(min, lon);
      max = Math.max(max, lon);
    }

    extent[0] = min;
    extent[2] = max;
  }

  if (extent[2] - extent[0] > 180) {
    // assume the inverse
    var tmp = extent[0] + 360;
    extent[0] = extent[2];
    extent[2] = tmp;
  }

  if (proj.getCode() !== os.proj.EPSG4326) {
    extent = ol.proj.transformExtent(extent, os.proj.EPSG4326, proj);
  }

  return extent;
};
