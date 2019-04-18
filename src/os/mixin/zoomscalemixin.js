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
  os.MapContainer.getInstance().listen(os.MapEvent.VIEW_CHANGE, function() {
    zoomScale = undefined;
  });

  /**
   * Get the scale value for the current map zoom.
   * @return {number|undefined} The scale value, or undefined when the current zoom is not rescaled.
   */
  var getZoomScale = function() {
    var altitude = os.MapContainer.getInstance().getAltitude();
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

    var zoomScale = getZoomScale();
    if (zoomScale != null) {
      this.scale_ *= zoomScale;
    }
  };

  var oldSetTextStyle = ol.render.canvas.TextReplay.prototype.setTextStyle;

  /**
   * @override
   */
  ol.render.canvas.TextReplay.prototype.setTextStyle = function(textStyle, declutterGroup) {
    oldSetTextStyle.call(this, textStyle, declutterGroup);

    var zoomScale = getZoomScale();
    if (zoomScale != null) {
      var textState = this.textState_;

      // hide text once it's scaled below 50% original size. it would be preferable to scale opacity, but in OpenLayers
      // that requires manipulating the color string which would not be performant here.
      zoomScale = zoomScale >= .5 ? zoomScale : 0;

      // this.textKey_ is a map index, so limit the scale adjustment to 1/10 increments
      textState.scale = Math.round(textState.scale * zoomScale * 10) / 10;
      this.textKey_ = textState.font + textState.scale + (textState.textAlign || '?');

      // adjust the offset to account for the scale change
      this.textOffsetX_ *= zoomScale;
      this.textOffsetY_ *= zoomScale;
    }
  };
})();
