goog.declareModuleId('plugin.capture.AnnotationTailRenderer');

import {getMapCanvas} from '../../os/capture/capture.js';
import SvgRenderer from '../../os/ui/capture/svgrenderer.js';


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
    // Only render the tail if it's visible within the current viewport. This is tested by checking the height/width of
    // the element within the viewport. These will be 0 if the element is not rendered in the viewport.
    const overlayEl = this.overlay_ ? this.overlay_.getElement() : null;
    const tailEl = this.overlay_ ? overlayEl.querySelector('svg.c-annotation__svg') : null;
    const rect = tailEl ? tailEl.getBoundingClientRect() : null;
    if (rect && rect.width > 0 && rect.height > 0) {
      return tailEl;
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
