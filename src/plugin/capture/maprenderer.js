goog.declareModuleId('plugin.capture.MapRenderer');

import {getMapCanvas} from '../../os/capture/capture.js';
import Settings from '../../os/config/settings.js';
import MapContainer from '../../os/mapcontainer.js';
import CanvasRenderer from '../../os/ui/capture/canvasrenderer.js';


/**
 * Renders the map to a canvas.
 */
export default class MapRenderer extends CanvasRenderer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.selector = getMapCanvas;
    this.title = 'Map';
  }

  /**
   * @inheritDoc
   */
  beforeOverlay() {
    var mapContainer = MapContainer.getInstance();
    if (mapContainer.is3DEnabled()) {
      var webGL = mapContainer.getWebGLRenderer();
      if (webGL) {
        webGL.renderSync();
      }
    } else {
      var olMap = mapContainer.getMap();
      if (olMap) {
        olMap.renderSync();
      }
    }
  }

  /**
   * @inheritDoc
   */
  getHeight() {
    var mapCanvas = this.getRenderElement();
    return mapCanvas ? mapCanvas.height : 0;
  }

  /**
   * @inheritDoc
   */
  getWidth() {
    var mapCanvas = this.getRenderElement();
    return mapCanvas ? mapCanvas.width : 0;
  }

  /**
   * @inheritDoc
   */
  getFill() {
    return /** @type {string} */ (Settings.getInstance().get(['bgColor'], '#000'));
  }
}
