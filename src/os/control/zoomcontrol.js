goog.declareModuleId('os.control.Zoom');

import OLZoom from 'ol/src/control/Zoom.js';

import * as interaction from '../interaction/interaction.js';
import {getMapContainer} from '../map/mapinstance.js';



/**
 * Overrides the OpenLayers zoom control to allow zooming in/out in WebGL.
 */
export default class Zoom extends OLZoom {
  /**
   * Constructor.
   * @param {olx.control.ZoomOptions=} opt_options Zoom options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  zoomByDelta_(delta) {
    var mapContainer = getMapContainer();
    if (mapContainer.is3DEnabled()) {
      var camera = mapContainer.getWebGLCamera();
      if (camera) {
        delta = interaction.getZoomDelta(true, delta < 0);
        camera.zoomByDelta(delta);
      }
    } else {
      super.zoomByDelta_(delta);
    }
  }
}
