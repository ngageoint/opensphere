goog.provide('plugin.capture.AnnotationTailRenderer');

goog.require('os.ui.capture.SvgRenderer');


/**
 * Renders the SVG tail for a map annotation to a canvas.
 * @param {!ol.Overlay} overlay The annotation overlay.
 * @extends {os.ui.capture.SvgRenderer}
 * @constructor
 */
plugin.capture.AnnotationTailRenderer = function(overlay) {
  plugin.capture.AnnotationTailRenderer.base(this, 'constructor');
  this.title = 'Annotation Tail';

  /**
   * The OpenLayers overlay.
   * @type {!ol.Overlay}
   * @private
   */
  this.overlay_ = overlay;
};
goog.inherits(plugin.capture.AnnotationTailRenderer, os.ui.capture.SvgRenderer);


/**
 * @inheritDoc
 */
plugin.capture.AnnotationTailRenderer.prototype.getRenderElement = function() {
  if (this.overlay_) {
    var overlayEl = this.overlay_.getElement();
    if (overlayEl) {
      return overlayEl.querySelector('svg.c-annotation__svg');
    }
  }

  return null;
};


/**
 * @inheritDoc
 */
plugin.capture.AnnotationTailRenderer.prototype.getPosition = function(canvas) {
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
