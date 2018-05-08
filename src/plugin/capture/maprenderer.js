goog.provide('plugin.capture.MapRenderer');

goog.require('goog.Promise');
goog.require('os.map');
goog.require('os.ui.capture.CanvasRenderer');
goog.require('plugin.cesium');



/**
 * Renders the map to a canvas.
 * @extends {os.ui.capture.CanvasRenderer}
 * @constructor
 */
plugin.capture.MapRenderer = function() {
  plugin.capture.MapRenderer.base(this, 'constructor');
  this.selector = plugin.capture.getMapCanvas;
  this.title = 'Map';
};
goog.inherits(plugin.capture.MapRenderer, os.ui.capture.CanvasRenderer);


/**
 * @inheritDoc
 */
plugin.capture.MapRenderer.prototype.beforeOverlay = function() {
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    var webGL = mapContainer.getWebGLRenderer();
    if (webGL) {
      webGL.renderSync();
    }
  } else {
    var olMap = mapContainer.getMap();
    if (olMap) {
      olMap.renderSync();
    }
  }
};


/**
 * @inheritDoc
 */
plugin.capture.MapRenderer.prototype.getHeight = function() {
  var mapCanvas = this.getRenderElement();
  return mapCanvas ? mapCanvas.height : 0;
};


/**
 * @inheritDoc
 */
plugin.capture.MapRenderer.prototype.getWidth = function() {
  var mapCanvas = this.getRenderElement();
  return mapCanvas ? mapCanvas.width : 0;
};


/**
 * @inheritDoc
 */
plugin.capture.MapRenderer.prototype.getFill = function() {
  return /** @type {string} */ (os.settings.get(['bgColor'], '#000'));
};


/**
 * Get the map canvas element.
 * @return {HTMLCanvasElement} The map canvas element
 */
plugin.capture.getMapCanvas = function() {
  var mapCanvas;
  if (os.MapContainer.getInstance().is3DEnabled()) {
    mapCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector(os.map.WEBGL_CANVAS));
  } else {
    mapCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector(os.map.OPENLAYERS_CANVAS));
  }

  return mapCanvas || null;
};


/**
 * Get the map canvas pixel ratio.
 * @return {number} The map canvas pixel ratio.
 */
plugin.capture.getMapPixelRatio = function() {
  var mapCanvas = plugin.capture.getMapCanvas();
  if (mapCanvas) {
    var mapRect = mapCanvas.getBoundingClientRect();
    return mapCanvas.width / mapRect.width;
  }

  return 1;
};
