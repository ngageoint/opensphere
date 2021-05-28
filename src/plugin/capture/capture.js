goog.module('plugin.capture');
goog.module.declareLegacyNamespace();

/**
 * Get the map canvas element.
 * @return {HTMLCanvasElement} The map canvas element
 * @deprecated Please use os.capture.getMapCanvas instead.
 */
const getMapCanvas = getMapCanvas;

/**
 * Get the map canvas pixel ratio.
 * @return {number} The map canvas pixel ratio.
 * @deprecated Please use os.capture.getMapPixelRatio instead.
 */
const getMapPixelRatio = getMapPixelRatio;

exports = {
  getMapCanvas,
  getMapPixelRatio
};
