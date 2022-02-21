goog.declareModuleId('plugin.capture.MapOverlayRenderer');

import HtmlRenderer from '../../os/ui/capture/htmlrenderer.js';

/**
 * Renders a map overlay to a canvas.
 */
export default class MapOverlayRenderer extends HtmlRenderer {
  /**
   * Constructor.
   * @param {!Overlay} overlay The overlay to render.
   */
  constructor(overlay) {
    super({
      'useRelativePosition': true
    });
    this.title = 'Map Overlay';

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
      return this.overlay_.getElement() || null;
    }

    return null;
  }
}
