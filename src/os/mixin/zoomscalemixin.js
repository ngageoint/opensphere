/**
 * @fileoverview This recreates behavior from Google Earth in the 2D map, where icons and labels are scaled/hidden
 *               based on the zoom level/camera distance.
 *
 * @suppress {accessControls} To allow access to private properties in OpenLayers classes.
 */
goog.provide('os.mixin.zoomscale');

goog.require('goog.math');
goog.require('ol.render.canvas.ImageReplay');
goog.require('ol.render.canvas.TextReplay');
goog.require('os.MapEvent');
goog.require('os.map');


(function() {
  // cache the zoom scale to reduce how often it's computed, resetting on map view change.
  var zoomScale;
  var mapContainer = os.MapContainer.getInstance();
  mapContainer.listen(os.MapEvent.VIEW_CHANGE, function() {
    zoomScale = undefined;
    mapContainer.render();
  });

  /**
   * Get the scale value for the current map zoom.
   * @return {number|undefined} The scale value, or undefined when the current zoom is not rescaled.
   */
  var getZoomScale = function() {
    var altitude = mapContainer.getAltitude();
    if (altitude > os.map.ZoomScale.NEAR) {
      // don't scale beyond the far altitude value
      altitude = Math.min(altitude, os.map.ZoomScale.FAR);

      zoomScale = goog.math.lerp(os.map.ZoomScale.NEAR_SCALE, os.map.ZoomScale.FAR_SCALE,
          (altitude - os.map.ZoomScale.NEAR) / (os.map.ZoomScale.FAR - os.map.ZoomScale.NEAR));
    }

    return zoomScale;
  };

  var oldSetImageStyle = ol.render.canvas.ImageReplay.prototype.setImageStyle;

  /**
   * @override
   */
  ol.render.canvas.ImageReplay.prototype.setImageStyle = function(imageStyle, declutterGroup) {
    oldSetImageStyle.call(this, imageStyle, declutterGroup);

    // only scale icon styles. this uses duck typing for performance reasons.
    if (typeof /** @type {ol.style.Icon} */ (imageStyle).getSrc !== 'function') {
      return;
    }

    var zoomScale = getZoomScale();
    if (zoomScale != null) {
      this.scale_ *= zoomScale;
    }
  };
})();
