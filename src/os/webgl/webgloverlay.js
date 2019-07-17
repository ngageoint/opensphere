goog.provide('os.webgl.WebGLOverlay');

goog.require('ol.Overlay');
goog.require('ol.proj');


/**
 * An OpenLayers overlay that supports positioning itself with a WebGL renderer.
 *
 * @param {olx.OverlayOptions} options Overlay options.
 * @constructor
 * @extends {ol.Overlay}
 */
os.webgl.WebGLOverlay = function(options) {
  os.webgl.WebGLOverlay.base(this, 'constructor', options);

  /**
   * Function to deregister the post render handler.
   * @type {function()|undefined}
   * @private
   */
  this.unPostRender_ = undefined;

  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    this.onWebGLActive();
  } else {
    mapContainer.listen(goog.events.EventType.PROPERTYCHANGE, this.onMapChange, false, this);
  }
};
goog.inherits(os.webgl.WebGLOverlay, ol.Overlay);


/**
 * @inheritDoc
 */
os.webgl.WebGLOverlay.prototype.disposeInternal = function() {
  os.webgl.WebGLOverlay.base(this, 'disposeInternal');

  os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange, false, this);

  if (this.unPostRender_) {
    this.unPostRender_();
  }
};


/**
 * @inheritDoc
 */
os.webgl.WebGLOverlay.prototype.getPosition = function() {
  // if the WebGL renderer is being initialized, positioning the overlay will fail.
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.isInitializingWebGL()) {
    return null;
  }

  return os.webgl.WebGLOverlay.base(this, 'getPosition');
};


/**
 * If the overlay is visible.
 *
 * @return {boolean}
 */
os.webgl.WebGLOverlay.prototype.isVisible = function() {
  return this.rendered.visible;
};


/**
 * @inheritDoc
 */
os.webgl.WebGLOverlay.prototype.setVisible = function(visible) {
  var changed = this.rendered.visible !== visible;
  os.webgl.WebGLOverlay.base(this, 'setVisible', visible);

  if (changed) {
    // notify when visibility changes so the annotation UI can update if needed
    this.notify('visible', visible);
  }
};


/**
 * Handle map property change events.
 *
 * @param {os.events.PropertyChangeEvent} event The event.
 * @protected
 */
os.webgl.WebGLOverlay.prototype.onMapChange = function(event) {
  if (event.getProperty() === os.MapChange.VIEW3D && event.getNewValue()) {
    os.MapContainer.getInstance().unlisten(goog.events.EventType.PROPERTYCHANGE, this.onMapChange, false, this);
    this.onWebGLActive();
  }
};


/**
 * Handle WebGL activiation on the map.
 *
 * @protected
 */
os.webgl.WebGLOverlay.prototype.onWebGLActive = function() {
  var webGLRenderer = os.MapContainer.getInstance().getWebGLRenderer();
  if (webGLRenderer) {
    // update the overlay on each WebGL post render event so it moves smoothly with the globe
    this.unPostRender_ = webGLRenderer.onPostRender(this.render.bind(this));
  }
};


/**
 * @inheritDoc
 */
os.webgl.WebGLOverlay.prototype.updatePixelPosition = function() {
  // do not update the overlay while WebGL is being initialized, or it will be positioned incorrectly.
  var mapContainer = os.MapContainer.getInstance();
  if (mapContainer.isInitializingWebGL()) {
    return;
  }

  var webGLRenderer = mapContainer.getWebGLRenderer();
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
