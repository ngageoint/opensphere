goog.module('plugin.capture');
goog.module.declareLegacyNamespace();

const MapContainer = goog.require('os.MapContainer');
const osMap = goog.require('os.map');

/**
 * Get the map canvas element.
 * @return {HTMLCanvasElement} The map canvas element
 */
const getMapCanvas = function() {
  var mapCanvas;
  if (MapContainer.getInstance().is3DEnabled()) {
    mapCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector(osMap.WEBGL_CANVAS));
  } else {
    mapCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector(osMap.OPENLAYERS_CANVAS));
  }

  return mapCanvas || null;
};


/**
 * Get the map canvas pixel ratio.
 * @return {number} The map canvas pixel ratio.
 */
const getMapPixelRatio = function() {
  var mapCanvas = getMapCanvas();
  if (mapCanvas) {
    var mapRect = mapCanvas.getBoundingClientRect();
    return mapCanvas.width / mapRect.width;
  }

  return 1;
};

exports = {
  getMapCanvas,
  getMapPixelRatio
};
