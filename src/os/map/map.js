goog.provide('os.MapChange');
goog.provide('os.MapEvent');
goog.provide('os.MapMode');
goog.provide('os.map');

goog.require('goog.asserts');
goog.require('ol.math');
goog.require('ol.tilegrid');
goog.require('os.map.IMapContainer');
goog.require('os.ol');
goog.require('os.proj');


/**
 * Reference to the global map container instance.
 * @type {os.map.IMapContainer|undefined}
 */
os.map.mapContainer = undefined;


/**
 * @enum {string}
 */
os.MapChange = {
  VIEW3D: 'map:change:view3d',
  THROTTLE: 'map:change:throttle'
};


/**
 * @enum {string}
 */
os.MapEvent = {
  MAP_READY: 'map:ready',
  RENDER: 'map:render',
  RENDER_SYNC: 'map:renderSync',
  VIEW_CHANGE: 'map:viewChange'
};


/**
 * Available map modes.
 * @enum {string}
 */
os.MapMode = {
  AUTO: 'auto',
  VIEW_2D: '2d',
  VIEW_3D: '3d'
};


/**
 * Modes for setting the camera position when the application is launched.
 * @enum {string}
 */
os.CameraMode = {
  DEFAULT: 'default',
  FIXED: 'fixed',
  LAST: 'last'
};


/**
 * Modes for flying to positions on the map.
 * @enum {string}
 */
os.FlightMode = {
  BOUNCE: 'bounce',
  SMOOTH: 'smooth'
};


/**
 * Default center position for the map.
 * @type {!ol.Coordinate}
 * @const
 */
os.map.DEFAULT_CENTER = [0, 0];


/**
 * Default zoom level for the map.
 * @type {number}
 * @const
 */
os.map.DEFAULT_ZOOM = 3;


/**
 * Minimum zoom level for the map
 * @type {number}
 * @const
 */
os.map.MIN_ZOOM = 2;


/**
 * Maximum zoom level for the map
 * @type {number}
 * @const
 */
os.map.MAX_ZOOM = 25;


/**
 * Maximum zoom used for go to/fly to operations
 * @type {number}
 * @const
 */
os.map.MAX_AUTO_ZOOM = 15;


/**
 * Projection used for the map and all of its layers.
 * @type {ol.proj.Projection}
 */
os.map.PROJECTION = ol.proj.get(os.proj.EPSG4326);


/**
 * Settings key for the map projection.
 * @type {string}
 * @const
 */
os.map.PROJECTION_KEY = 'baseProjection';


/**
 * Tile grid to request 512x512 tiles.
 * @type {ol.tilegrid.TileGrid}
 */
os.map.TILEGRID = ol.tilegrid.createForProjection(os.map.PROJECTION, ol.DEFAULT_MAX_ZOOM, [512, 512]);


/**
 * These constants don't represent any well-known values. C is for "Constant" and E is for "Exponent" in the curve fit
 * that I used on the data.
 *
 * @type {number}
 * @const
 */
os.map.C = 110841096.471006;


/**
 * These constants don't represent any well-known values. C is for "Constant" and E is for "Exponent" in the curve fit
 * that I used on the data.
 *
 * @type {number}
 * @const
 */
os.map.E = 0.9151598587;


/**
 * Empty extent used to test an uninitialized extent state.
 * @type {ol.Extent}
 * @const
 */
os.map.ZERO_EXTENT = [0, 0, 0, 0];


/**
 * Gets the zoom level from the given resolution
 * @param {number} resolution
 * @param {ol.proj.Projection} projection
 * @return {number} zoom
 */
os.map.resolutionToZoom = function(resolution, projection) {
  var extent = projection.getExtent();
  var size = extent[2] - extent[0];

  // todo: replace "Math.LN2" with the log of the view's zoom factor, which does not
  // appear to be accessible through the api at the moment.
  return Math.log(size / (256 * resolution)) / Math.LN2;
};


/**
 * Gets the resolution for the given zoom level
 * @param {number} zoom
 * @param {ol.proj.Projection} projection
 * @return {number} resolution (degrees per pixel)
 */
os.map.zoomToResolution = function(zoom, projection) {
  var extent = projection.getExtent();
  var size = extent[2] - extent[0];

  // todo: replace "2" with the view's zoom factor, which does not appear to be
  // accessible through the api at the moment.
  return size / (256 * Math.pow(2, zoom));
};


/**
 * Maximum zoom level for the map
 * @type {number}
 */
os.map.MIN_RESOLUTION = os.map.zoomToResolution(os.map.MAX_ZOOM, os.map.PROJECTION);


/**
 * Maximum zoom level for the map
 * @type {number}
 */
os.map.MAX_RESOLUTION = os.map.zoomToResolution(os.map.MIN_ZOOM, os.map.PROJECTION);


/**
 * Get the degrees per pixel for a provided zoom level.
 * @param {number} zoom The zoom level
 * @return {number} The degrees per pixel
 * @private
 */
os.map.getDegreesPerPixel_ = function(zoom) {
  return 90.0 / (256 * Math.pow(2, zoom - 2));
};


/**
 * @param {number} dpp The degrees per pixel
 * @return {number}
 * @private
 */
os.map.getZoom_ = function(dpp) {
  return 2 + Math.log(90.0 / (256 * dpp)) / Math.LN2;
};


/**
 * Calculate the camera distance for a given resolution.
 *
 * @param {Array.<number>} size
 * @param {number} resolution The view resolution.
 * @param {number=} opt_latitude The latitude to use in the calculation, defaults to 0.
 *
 * @return {number} The distance
 */
os.map.distanceForResolution = function(size, resolution, opt_latitude) {
  goog.asserts.assert(size != null && size.length > 0, 'size should be defined');

  var aspectRatio = size[0] / size[1];

  var fov = ol.math.toRadians(45);
  var fovy = (aspectRatio <= 1) ? fov : Math.atan(Math.tan(fov * 0.5) / aspectRatio) * 2.0;

  var metersPerUnit = os.map.PROJECTION.getMetersPerUnit();

  // number of "map units" visible in 2D (vertically)
  var visibleMapUnits = resolution * size[1];

  // The metersPerUnit does not take latitude into account, but it should
  // be lower with increasing latitude -- we have to compensate.
  // In 3D it is not possible to maintain the resolution at more than one point,
  // so it only makes sense to use the latitude of the "target" point.
  var latitude = opt_latitude || 0;
  var relativeCircumference = Math.cos(Math.abs(latitude));

  // how many meters should be visible in 3D
  var visibleMeters = visibleMapUnits * metersPerUnit * relativeCircumference;

  // distance required to view the calculated length in meters
  //
  //  fovy/2
  //    |\
  //  x | \
  //    |--\
  // visibleMeters/2
  var requiredDistance = (visibleMeters / 2) / Math.tan(fovy / 2);

  // NOTE: This calculation is not absolutely precise, because metersPerUnit
  // is a great simplification. It does not take ellipsoid/terrain into account.

  return requiredDistance;
};


/**
 * Calculate the view resolution for a camera distance.
 *
 * @param {os.Map} map The map.
 * @param {number} distance The camera distance.
 * @param {number=} opt_latitude The latitude to use in the calculation, defaults to 0.
 *
 * @return {number} The calculated resolution, or NaN if the resolution cannot be calculated.
 */
os.map.resolutionForDistance = function(map, distance, opt_latitude) {
  goog.asserts.assert(map != null, 'map should be defined');

  var size = map.getSize();
  if (!size || size[0] <= 0 || size[1] <= 0) {
    return NaN;
  }

  var aspectRatio = size[0] / size[1];

  var fov = ol.math.toRadians(45);
  var fovy = (aspectRatio <= 1) ? fov : Math.atan(Math.tan(fov * 0.5) / aspectRatio) * 2.0;

  var metersPerUnit = os.map.PROJECTION.getMetersPerUnit();

  // See the reverse calculation (calcDistanceForResolution) for details
  var visibleMeters = 2 * distance * Math.tan(fovy / 2);

  var latitude = opt_latitude || 0;
  var relativeCircumference = Math.abs(Math.cos(latitude));

  var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  var resolution = visibleMapUnits / size[1];

  return resolution;
};
