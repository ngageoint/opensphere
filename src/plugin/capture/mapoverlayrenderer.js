goog.provide('plugin.capture.MapOverlayRenderer');

goog.require('os.ui.capture.HtmlRenderer');


/**
 * Renders a map overlay to a canvas.
 *
 * @param {!ol.Overlay} overlay The overlay to render.
 * @extends {os.ui.capture.HtmlRenderer}
 * @constructor
 */
plugin.capture.MapOverlayRenderer = function(overlay) {
  plugin.capture.MapOverlayRenderer.base(this, 'constructor');
  this.title = 'Map Overlay';

  /**
   * The OpenLayers overlay.
   * @type {!ol.Overlay}
   * @private
   */
  this.overlay_ = overlay;
};
goog.inherits(plugin.capture.MapOverlayRenderer, os.ui.capture.HtmlRenderer);


/**
 * @inheritDoc
 */
plugin.capture.MapOverlayRenderer.prototype.getRenderElement = function() {
  if (this.overlay_) {
    return this.overlay_.getElement() || null;
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.capture.MapOverlayRenderer.prototype.getPosition = function(canvas) {
  var x = 0;
  var y = 0;

  // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
  // pixels do not directly correspond to CSS pixels.
  var mapCanvas = plugin.capture.getMapCanvas();
  var annotationEl = this.getRenderElement();

  if (mapCanvas && annotationEl) {
    // Since OpenLayers allows for specifying the pixel ratio on a map (rather than always
    // using window.devicePixelRatio directly), we will calculate it
    var mapRect = mapCanvas.getBoundingClientRect();
    var pixelRatio = mapCanvas.width / mapRect.width;

    var overlayRect = annotationEl.getBoundingClientRect();
    // determine the overlay's position over the map
    x = pixelRatio * overlayRect.x;
    y = pixelRatio * (overlayRect.y - mapRect.y);
  }

  return [x, y];
};
