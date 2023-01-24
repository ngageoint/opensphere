goog.declareModuleId('os.map');

import {linear as linearEasing} from 'ol/src/easing.js';
import {clamp, toRadians} from 'ol/src/math.js';
import {get as getProjection} from 'ol/src/proj.js';
import {DEFAULT_MAX_ZOOM} from 'ol/src/tilegrid/common.js';
import {createForProjection} from 'ol/src/tilegrid.js';

import '../ol/ol.js';
import FlightMode from './flightmode.js';

const {assert} = goog.require('goog.asserts');

/**
 * Selector for the OpenLayers map canvas.
 * @type {string}
 */
export const OPENLAYERS_CANVAS = '.ol-viewport > canvas';

/**
 * Class name for the WebGL canvas.
 * @type {string}
 */
export const WEBGL_CANVAS_CLASS = 'webgl-canvas';

/**
 * Selector for the WebGL canvas.
 * @type {string}
 */
export const WEBGL_CANVAS = 'canvas.' + WEBGL_CANVAS_CLASS;

/**
 * Default center position for the map.
 * @type {!ol.Coordinate}
 */
export const DEFAULT_CENTER = [0, 0];

/**
 * Default zoom level for the map.
 * @type {number}
 */
export const DEFAULT_ZOOM = 3;

/**
 * Minimum zoom level for the map
 * @type {number}
 */
export const MIN_ZOOM = 0;

/**
 * Minimum zoom level for the map
 * @type {number}
 */
export const OVERVIEW_MAP_MIN_ZOOM = 2;

/**
 * Maximum zoom level for the map
 * @type {number}
 */
export const MAX_ZOOM = 25;

/**
 * Maximum zoom used for go to/fly to operations
 * @type {number}
 */
export const MAX_AUTO_ZOOM = 18;

/**
 * Projection used for the map and all of its layers.
 * @type {Projection}
 */
export let PROJECTION = getProjection('EPSG:4326');

/**
 * Set the map projection.
 * @param {Projection} value The projection.
 */
export const setProjection = (value) => {
  PROJECTION = value;
};

/**
 * Settings key for the map projection.
 * @type {string}
 */
export const PROJECTION_KEY = 'baseProjection';

/**
 * Tile grid to request 512x512 tiles.
 * @type {TileGrid}
 */
export let TILEGRID = createForProjection(PROJECTION, DEFAULT_MAX_ZOOM, [512, 512]);

/**
 * Set the map tile grid.
 * @param {TileGrid} value The tile grid.
 */
export const setTileGrid = (value) => {
  TILEGRID = value;
};

/**
 * These constants don't represent any well-known values. C is for "Constant" and E is for "Exponent" in the curve fit
 * that I used on the data.
 *
 * @type {number}
 */
export const C = 110841096.471006;

/**
 * These constants don't represent any well-known values. C is for "Constant" and E is for "Exponent" in the curve fit
 * that I used on the data.
 *
 * @type {number}
 */
export const E = 0.9151598587;

/**
 * Empty extent used to test an uninitialized extent state.
 * @type {ol.Extent}
 */
export const ZERO_EXTENT = [0, 0, 0, 0];

/**
 * The default fly zoom duration.
 * @type {number}
 */
export const FLY_ZOOM_DURATION = 1000;

/**
 * Properties to scale icons/labels by camera distance. Near/far values represent camera altitude in meters.
 * @type {!Object<string, number>}
 */
export const ZoomScale = {
  NEAR: 3e6,
  NEAR_SCALE: 1,
  FAR: 3e7,
  FAR_SCALE: .5
};

/**
 * Gets the zoom level from the given resolution.
 *
 * @param {number} resolution The view resolution.
 * @param {Projection} projection The map projection.
 * @param {number=} opt_precision The decimal precision
 * @return {number} zoom
 */
export const resolutionToZoom = function(resolution, projection, opt_precision) {
  var extent = projection.getExtent();
  var size = extent[2] - extent[0];

  // todo: replace "Math.LN2" with the log of the view's zoom factor, which does not
  // appear to be accessible through the api at the moment.
  var zoom = Math.log(size / (256 * resolution)) / Math.LN2;

  if (opt_precision != null) {
    zoom = Number(zoom.toFixed(opt_precision));
  }

  return zoom;
};

/**
 * Gets the resolution for the given zoom level
 *
 * @param {number} zoom
 * @param {Projection} projection
 * @return {number} resolution (degrees per pixel)
 */
export const zoomToResolution = function(zoom, projection) {
  var extent = projection.getExtent();
  var size = extent[2] - extent[0];

  // todo: replace "2" with the view's zoom factor, which does not appear to be
  // accessible through the api at the moment.
  return size / (256 * Math.pow(2, zoom));
};

/**
 * Minimum zoom level for the map
 * @type {number}
 */
export let MIN_RESOLUTION = zoomToResolution(MAX_ZOOM, PROJECTION);

/**
 * Set the map minimum resolution.
 * @param {number} value The minimum resolution.
 */
export const setMinResolution = (value) => {
  MIN_RESOLUTION = value;
};

/**
 * Maximum zoom level for the map
 * @type {number}
 */
export let MAX_RESOLUTION = zoomToResolution(MIN_ZOOM, PROJECTION);

/**
 * Set the map minimum resolution.
 * @param {number} value The minimum resolution.
 */
export const setMaxResolution = (value) => {
  MAX_RESOLUTION = value;
};

/**
 * Calculate the camera distance for a given resolution.
 *
 * @param {Array<number>} size
 * @param {number} resolution The view resolution.
 * @param {number=} opt_latitude The latitude to use in the calculation, defaults to 0.
 *
 * @return {number} The distance
 */
export const distanceForResolution = function(size, resolution, opt_latitude) {
  assert(size != null && size.length > 0, 'size should be defined');

  var aspectRatio = size[0] / size[1];

  var fov = toRadians(45);
  var fovy = (aspectRatio <= 1) ? fov : Math.atan(Math.tan(fov * 0.5) / aspectRatio) * 2.0;

  var metersPerUnit = PROJECTION.getMetersPerUnit();

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
 * @param {PluggableMap} map The map.
 * @param {number} distance The camera distance.
 * @param {number=} opt_latitude The latitude to use in the calculation, defaults to 0.
 *
 * @return {number} The calculated resolution, or NaN if the resolution cannot be calculated.
 */
export const resolutionForDistance = function(map, distance, opt_latitude) {
  assert(map != null, 'map should be defined');

  var size = map.getSize();
  if (!size || size[0] <= 0 || size[1] <= 0) {
    return NaN;
  }

  var aspectRatio = size[0] / size[1];

  var fov = toRadians(45);
  var fovy = (aspectRatio <= 1) ? fov : Math.atan(Math.tan(fov * 0.5) / aspectRatio) * 2.0;

  var metersPerUnit = PROJECTION.getMetersPerUnit();

  // See the reverse calculation (calcDistanceForResolution) for details
  var visibleMeters = 2 * distance * Math.tan(fovy / 2);

  var latitude = opt_latitude || 0;
  var relativeCircumference = Math.abs(Math.cos(latitude));

  var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
  var resolution = visibleMapUnits / size[1];

  return resolution;
};

/**
 *
 * @param {!osx.map.FlyToOptions} options
 * @param {OLMap} map
 */
export const flyTo = function(options, map) {
  if (map) {
    const view = map.getView();

    // translate 3D heading to OpenLayers rotation if defined and non-zero
    const rotation = options.heading ? toRadians(-options.heading) : 0;
    const center = options.destination || options.center || view.getCenter();
    const duration = options.duration || FLY_ZOOM_DURATION;

    const animateOptions = /** @type {!olx.AnimationOptions} */ ({
      center,
      duration,
      rotation
    });

    if (options.zoom !== undefined) {
      // prioritize zoom in 2D mode
      animateOptions.zoom = clamp(options.zoom, MIN_ZOOM, MAX_ZOOM);
    } else if (!options.positionCamera && options.range !== undefined) {
      // telling the camera where to look, so a range will generally be specified
      const resolution = resolutionForDistance(map, options.range, 0);
      animateOptions.resolution = clamp(resolution, MIN_RESOLUTION, MAX_RESOLUTION);
    } else if (options.altitude !== undefined) {
      // try altitude last, because it will generally be 0 if positioning the camera
      const resolution = resolutionForDistance(map, options.altitude, 0);
      animateOptions.resolution = clamp(resolution, MIN_RESOLUTION, MAX_RESOLUTION);
    }

    // 'bounce' uses default easing, 'smooth' uses linear.
    if (options.flightMode === FlightMode.SMOOTH) {
      animateOptions.easing = linearEasing;
    }

    view.animate(animateOptions);
  }
};
