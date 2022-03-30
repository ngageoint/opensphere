goog.declareModuleId('os.webgl');

import {getContext} from 'ol/src/webgl.js';
import AltitudeMode from './altitudemode.js';

const userAgent = goog.require('goog.userAgent');


/**
 * Checks if WebGL and required extensions are supported by the browser.
 *
 * @return {boolean}
 */
export const isSupported = function() {
  if (Modernizr.webgl) {
    if (userAgent.IE) {
      // early versions of IE11 supported a minimal version of webgl, so check several extensions to make sure proper
      // webgl support exists
      return Modernizr.webglextensions.ANGLE_instanced_arrays &&
          Modernizr.webglextensions.EXT_texture_filter_anisotropic &&
          Modernizr.webglextensions.OES_element_index_uint &&
          Modernizr.webglextensions.OES_texture_float &&
          Modernizr.webglextensions.OES_texture_float_linear &&
          Modernizr.webglextensions.WEBGL_compressed_texture_s3tc;
    }

    return true;
  }

  return false;
};

/**
 * Checks if WebGL will be rendered with degraded performance
 *
 * @return {?boolean}
 */
export const hasPerformanceCaveat = function() {
  try {
    var contextOptions = {
      failIfMajorPerformanceCaveat: true
    };
    var canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    if (getContext(canvas, contextOptions)) {
      return false;
    }
    if (getContext(canvas)) {
      return true;
    }
  } catch (e) {
    // Handle and return null
  }
  return null;
};

/**
 * Gets a human readable name for altitude mode
 *
 * @param {AltitudeMode} altitudeMode - The mode to map to a name
 * @return {string}
 */
export const mapAltitudeModeToName = function(altitudeMode) {
  switch (altitudeMode) {
    case AltitudeMode.ABSOLUTE:
      return 'Absolute';
    case AltitudeMode.CLAMP_TO_GROUND:
      return 'Clamp to Ground';
    case AltitudeMode.RELATIVE_TO_GROUND:
      return 'Relative to Ground';
    case AltitudeMode.CLAMP_TO_SEA_FLOOR:
      return 'Clamp to Sea Floor';
    case AltitudeMode.RELATIVE_TO_SEAFLOOR:
      return 'Relative to Sea Floor';
    default:
      return '';
  }
};
