goog.provide('os.webgl');
goog.provide('os.webgl.AltitudeMode');

goog.require('goog.userAgent');
goog.require('ol.webgl');


/**
 * Checks if WebGL and required extensions are supported by the browser.
 *
 * @return {boolean}
 */
os.webgl.isSupported = function() {
  if (Modernizr.webgl) {
    if (goog.userAgent.IE) {
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
 * @return {boolean|null}
 */
os.webgl.hasPerformanceCaveat = function() {
  try {
    var contextOptions = {
      failIfMajorPerformanceCaveat: true
    };
    var canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    if (ol.webgl.getContext(canvas, contextOptions)) {
      return false;
    }
    if (ol.webgl.getContext(canvas)) {
      return true;
    }
  } catch (e) {
    // Handle and return null
  }
  return null;
};


/**
 * Represents altitude value relative to terrain.
 * @enum {string}
 */
os.webgl.AltitudeMode = {
  /** Altitude value is ignored and value is clamped to terrain */
  CLAMP_TO_GROUND: 'clampToGround',
  /** Altitude value is absolute to mean sea level */
  ABSOLUTE: 'absolute',
  /** Altitude value is relative to terrain */
  RELATIVE_TO_GROUND: 'relativeToGround',
  /** Altitude value is ignored and value is clamped to the sea floor */
  CLAMP_TO_SEA_FLOOR: 'clampToSeaFloor',
  /** Altitude value is relative to the sea floor */
  RELATIVE_TO_SEAFLOOR: 'relativeToSeaFloor'
};


/**
 * Gets a human readable name for altitude mode
 *
 * @param {os.webgl.AltitudeMode} altitudeMode - The mode to map to a name
 * @return {string}
 */
os.webgl.mapAltitudeModeToName = function(altitudeMode) {
  switch (altitudeMode) {
    case os.webgl.AltitudeMode.ABSOLUTE:
      return 'Absolute';
    case os.webgl.AltitudeMode.CLAMP_TO_GROUND:
      return 'Clamp to Ground';
    case os.webgl.AltitudeMode.RELATIVE_TO_GROUND:
      return 'Relative to Ground';
    case os.webgl.AltitudeMode.CLAMP_TO_SEA_FLOOR:
      return 'Clamp to Sea Floor';
    case os.webgl.AltitudeMode.RELATIVE_TO_SEAFLOOR:
      return 'Relative to Sea Floor';
    default:
      return '';
  }
};
