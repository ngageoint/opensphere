goog.declareModuleId('plugin.capture.AnnotationTailRenderer');

const {getMapCanvas} = goog.require('os.capture');
const SvgRenderer = goog.require('os.ui.capture.SvgRenderer');

const Overlay = goog.requireType('ol.Overlay');


/**
 * Renders the SVG tail for a map annotation to a canvas.
 */
export default class AnnotationTailRenderer extends SvgRenderer {
  /**
   * Constructor.
   * @param {!Overlay} overlay The annotation overlay.
   */
  constructor(overlay) {
    super();
    this.title = 'Annotation Tail';

    /**
     * The OpenLayers overlay.
     * @type {!Overlay}
     * @private
     */
    this.overlay_ = overlay;
  }

  /**
   * @inheritDoc
   */
  getRenderElement() {
    if (this.overlay_) {
      var overlayEl = this.overlay_.getElement();
      if (overlayEl) {
        return overlayEl.querySelector('svg.c-annotation__svg');
      }
    }

    return null;
  }

  /**
   * @inheritDoc
   */
  getPosition(canvas) {
    var x = 0;
    var y = 0;

    // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
    // pixels do not directly correspond to CSS pixels.
    var mapCanvas = getMapCanvas();
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
  }
}
