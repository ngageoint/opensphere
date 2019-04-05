/**
 * @fileoverview This is intended to eventually replace os.geo with equivalent functions
 * which are entirely projection-agnostic rather than requiring conversion to lonlat and
 * back when using them.
 */
goog.provide('os.geo2');
goog.require('os.map');


/**
 * @param {number} lon
 * @param {number=} opt_min
 * @param {number=} opt_max
 * @param {ol.proj.Projection=} opt_proj
 * @return {number}
 */
os.geo2.normalizeLongitude = function(lon, opt_min, opt_max, opt_proj) {
  opt_proj = opt_proj || os.map.PROJECTION;
  var projExtent = opt_proj.getExtent();
  opt_min = opt_min != null ? opt_min : projExtent[0];
  opt_max = opt_max != null ? opt_max : projExtent[2];
  var width = opt_max - opt_min;

  // Note: OpenLayers uses this same method in ol/renderer/map.js
  var worldsAway = Math.ceil((opt_min - lon) / width);
  lon += width * worldsAway;

  return lon;
};
