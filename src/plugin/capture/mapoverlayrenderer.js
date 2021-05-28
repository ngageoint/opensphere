goog.module('plugin.capture.MapOverlayRenderer');
goog.module.declareLegacyNamespace();

const HtmlRenderer = goog.require('os.ui.capture.HtmlRenderer');


/**
 * Renders a map overlay to a canvas.
 */
class MapOverlayRenderer extends HtmlRenderer {
  /**
   * Constructor.
   * @param {!ol.Overlay} overlay The overlay to render.
   */
  constructor(overlay) {
    super({
      'useRelativePosition': true
    });
    this.title = 'Map Overlay';

    /**
     * The OpenLayers overlay.
     * @type {!ol.Overlay}
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

exports = MapOverlayRenderer;
