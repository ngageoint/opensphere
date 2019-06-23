goog.provide('plugin.capture.MapOverlayRenderer');

goog.require('os.ui.capture.HtmlRenderer');


/**
 * Renders a map overlay to a canvas.
 * @param {!ol.Overlay} overlay The overlay to render.
 * @extends {os.ui.capture.HtmlRenderer}
 * @constructor
 */
plugin.capture.MapOverlayRenderer = function(overlay) {
  plugin.capture.MapOverlayRenderer.base(this, 'constructor', {
    'useRelativePosition': true
  });
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
