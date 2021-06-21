goog.module('os.control.Zoom');
goog.module.declareLegacyNamespace();

const OLZoom = goog.require('ol.control.Zoom');
const interaction = goog.require('os.interaction');
const mapInstance = goog.require('os.map.instance');


/**
 * Overrides the OpenLayers zoom control to allow zooming in/out in WebGL.
 */
class Zoom extends OLZoom {
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
    var mapContainer = mapInstance.getMapContainer();
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

exports = Zoom;
