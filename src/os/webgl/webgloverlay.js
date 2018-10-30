goog.provide('os.webgl.WebGLOverlay');

goog.require('ol.Overlay');
goog.require('ol.proj');


/**
 * An OpenLayers overlay that supports positioning itself with a WebGL renderer.
 * @param {olx.OverlayOptions} options Overlay options.
 * @constructor
 * @extends {ol.Overlay}
 */
os.webgl.WebGLOverlay = function(options) {
  os.webgl.WebGLOverlay.base(this, 'constructor', options);
};
goog.inherits(os.webgl.WebGLOverlay, ol.Overlay);


/**
 * @inheritDoc
 */
os.webgl.WebGLOverlay.prototype.updatePixelPosition = function() {
  var webGLRenderer = os.MapContainer.getInstance().getWebGLRenderer();
  if (webGLRenderer && webGLRenderer.getEnabled()) {
    var map = this.getMap();
    var position = this.getPosition();
    if (!map || !map.isRendered() || !position) {
      // map isn't ready, so hide the overlay
      this.setVisible(false);
    } else {
      var coord = ol.proj.toLonLat(position, os.map.PROJECTION);
      var pixel = webGLRenderer.getPixelFromCoordinate(coord, true);
      if (!pixel) {
        // coordinate is not visible, so hide the overlay
        this.setVisible(false);
      } else {
        // position the overlay
        var mapSize = map.getSize();
        this.updateRenderedPosition(pixel, mapSize);
      }
    }

    return;
  }

  os.webgl.WebGLOverlay.base(this, 'updatePixelPosition');
};
