goog.provide('os.webgl');

goog.require('goog.userAgent');
goog.require('ol.webgl');


/**
 * Checks if WebGL and required extensions are supported by the browser.
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
