/**
 * @fileoverview Loads mixins and performs common functions for Openlayers.
 */
goog.declareModuleId('os.ol');

import FlightMode from '../map/flightmode.js';
import * as osMap from '../map/map.js';
import './mixin/disposablemixin.js';
import './mixin/rendermixin.js';

const {clamp, toRadians} = goog.require('goog.math');
const {linear: linearEasing} = goog.require('ol.easing');

const OLMap = goog.requireType('ol.Map');

/**
 * The default fly zoom duration.
 * @type {number}
 */
export const FLY_ZOOM_DURATION = 1000;

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
      animateOptions.zoom = clamp(options.zoom, osMap.MIN_ZOOM, osMap.MAX_ZOOM);
    } else if (!options.positionCamera && options.range !== undefined) {
      // telling the camera where to look, so a range will generally be specified
      const resolution = osMap.resolutionForDistance(map, options.range, 0);
      animateOptions.resolution = clamp(resolution, osMap.MIN_RESOLUTION, osMap.MAX_RESOLUTION);
    } else if (options.altitude !== undefined) {
      // try altitude last, because it will generally be 0 if positioning the camera
      const resolution = osMap.resolutionForDistance(map, options.altitude, 0);
      animateOptions.resolution = clamp(resolution, osMap.MIN_RESOLUTION, osMap.MAX_RESOLUTION);
    }

    // 'bounce' uses default easing, 'smooth' uses linear.
    if (options.flightMode === FlightMode.SMOOTH) {
      animateOptions.easing = linearEasing;
    }

    view.animate(animateOptions);
  }
};
