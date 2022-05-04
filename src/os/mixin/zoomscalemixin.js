/**
 * @fileoverview This recreates behavior from Google Earth in the 2D map, where icons are scaled/hidden based on the
 *               zoom level/camera distance.
 *
 * @suppress {accessControls} To allow access to private properties in OpenLayers classes.
 */
goog.declareModuleId('os.mixin.zoomscale');

import {listen} from 'ol/src/events.js';
import ImageReplay from 'ol/src/render/canvas/ImageBuilder.js';
import EventType from 'ol/src/render/EventType.js';

import * as osMap from '../map/map.js';
import MapEvent from '../map/mapevent.js';
import MapContainer from '../mapcontainer.js';

const {lerp} = goog.require('goog.math');

// cache values to reduce how often the zoom scale is computed
let zoomScale;
let lastAltitude;

const mapContainer = MapContainer.getInstance();

/**
 * Update the scale value for the current map zoom.
 */
const updateZoomScale = function() {
  let altitude = mapContainer.getAltitude();
  if (lastAltitude != altitude) {
    lastAltitude = altitude;

    if (altitude <= osMap.ZoomScale.NEAR) {
      // don't scale icons beyond the near limit
      zoomScale = undefined;
    } else {
      // don't scale beyond the far altitude value
      altitude = Math.min(altitude, osMap.ZoomScale.FAR);

      zoomScale = lerp(osMap.ZoomScale.NEAR_SCALE, osMap.ZoomScale.FAR_SCALE,
          (altitude - osMap.ZoomScale.NEAR) / (osMap.ZoomScale.FAR - osMap.ZoomScale.NEAR));
    }
  }
};

// update the zoom scale when the precompose event is fired, which will happen once per frame.
mapContainer.listenOnce(MapEvent.MAP_READY, function() {
  const map = mapContainer.getMap();
  if (map) {
    listen(map, EventType.PRECOMPOSE, updateZoomScale);
  }
});

const oldSetImageStyle = ImageReplay.prototype.setImageStyle;

/**
 * @override
 */
ImageReplay.prototype.setImageStyle = function(imageStyle, declutterGroup) {
  oldSetImageStyle.call(this, imageStyle, declutterGroup);

  // only scale icon styles. this uses duck typing for performance reasons.
  if (typeof /** @type {Icon} */ (imageStyle).getSrc !== 'function') {
    return;
  }

  if (zoomScale != null) {
    if (Array.isArray(this.scale_)) {
      for (let i = 0; i < this.scale_.length; i++) {
        this.scale_[i] = imageStyle.getScale() * zoomScale;
      }
    } else {
      this.scale_ = imageStyle.getScale() * zoomScale;
    }
  } else if (Array.isArray(this.scale_)) {
    for (let i = 0; i < this.scale_.length; i++) {
      this.scale_[i] = imageStyle.getScale();
    }
  } else {
    this.scale_ = imageStyle.getScale();
  }
};
