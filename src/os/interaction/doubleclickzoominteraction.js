goog.declareModuleId('os.interaction.DoubleClickZoom');

import {platformModifierKeyOnly} from 'ol/src/events/condition.js';
import OLDoubleClickZoom from 'ol/src/interaction/DoubleClickZoom.js';
import {zoomByDelta} from 'ol/src/interaction/Interaction.js';
import MapBrowserEventType from 'ol/src/MapBrowserEventType.js';

import I3DSupport from '../i3dsupport.js';
import osImplements from '../implements.js';
import MapContainer from '../mapcontainer.js';


/**
 * Extends the OpenLayers double click zoom interaction to support WebGL.
 *
 * @implements {I3DSupport}
 */
export default class DoubleClickZoom extends OLDoubleClickZoom {
  /**
   * Constructor.
   * @param {olx.interaction.DoubleClickZoomOptions=} opt_options Options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * @inheritDoc
   */
  is3DSupported() {
    return true;
  }

  /**
   * Handles the {@link ol.MapBrowserEvent map browser event} (if it was a
   * doubleclick) and eventually zooms the map.
   *
   * @param {ol.MapBrowserEvent} mapBrowserEvent Map browser event.
   * @return {boolean} `false` to stop event propagation.
   * @this os.interaction.DoubleClickZoom
   * @suppress {accessControls|duplicate}
   */
  handleEvent(mapBrowserEvent) {
    var stopEvent = false;

    if (mapBrowserEvent.type == MapBrowserEventType.DBLCLICK) {
      var anchor = mapBrowserEvent.coordinate;
      var zoomOut = platformModifierKeyOnly(mapBrowserEvent);

      var mapContainer = MapContainer.getInstance();
      if (mapContainer.is3DEnabled()) {
        var camera = mapContainer.getWebGLCamera();
        if (camera) {
          var currentAltitude = camera.getAltitude();
          var altitude = zoomOut ? (currentAltitude * 2) : (currentAltitude / 2);

          camera.flyTo(/** @type {!osx.map.FlyToOptions} */ ({
            center: anchor,
            altitude: altitude,
            duration: this.duration_
          }));
        }
      } else {
        var delta = zoomOut ? -this.delta_ : this.delta_;
        var view = mapBrowserEvent.map.getView();
        if (view) {
          zoomByDelta(view, delta, anchor, this.duration_);
        }
      }

      mapBrowserEvent.preventDefault();
      stopEvent = true;
    }
    return !stopEvent;
  }
}

osImplements(DoubleClickZoom, I3DSupport.ID);
