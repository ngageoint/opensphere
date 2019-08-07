/**
 * @fileoverview This recreates behavior from Google Earth in the 2D map, where icons are scaled/hidden based on the
 *               zoom level/camera distance.
 *
 * @suppress {accessControls} To allow access to private properties in OpenLayers classes.
 */
goog.provide('os.mixin.zoomscale');

goog.require('goog.math');
goog.require('ol.render.EventType');
goog.require('ol.render.canvas.ImageReplay');
goog.require('os.MapContainer');
goog.require('os.MapEvent');
goog.require('os.map');


(function() {
  // cache values to reduce how often the zoom scale is computed
  var zoomScale;
  var lastAltitude;

  var mapContainer = os.MapContainer.getInstance();

  /**
   * Update the scale value for the current map zoom.
   */
  var updateZoomScale = function() {
    var altitude = mapContainer.getAltitude();
    if (lastAltitude != altitude) {
      lastAltitude = altitude;

      if (altitude <= os.map.ZoomScale.NEAR) {
        // don't scale icons beyond the near limit
        zoomScale = undefined;
      } else {
        // don't scale beyond the far altitude value
        altitude = Math.min(altitude, os.map.ZoomScale.FAR);

        zoomScale = goog.math.lerp(os.map.ZoomScale.NEAR_SCALE, os.map.ZoomScale.FAR_SCALE,
            (altitude - os.map.ZoomScale.NEAR) / (os.map.ZoomScale.FAR - os.map.ZoomScale.NEAR));
      }
    }
  };

  // update the zoom scale when the precompose event is fired, which will happen once per frame.
  mapContainer.listenOnce(os.MapEvent.MAP_READY, function() {
    var map = mapContainer.getMap();
    if (map) {
      ol.events.listen(map, ol.render.EventType.PRECOMPOSE, updateZoomScale);
    }
  });

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

    if (zoomScale != null) {
      this.scale_ *= zoomScale;
    }
  };
})();
