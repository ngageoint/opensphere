goog.declareModuleId('plugin.capture.MapRenderer');

const MapContainer = goog.require('os.MapContainer');
const {getMapCanvas} = goog.require('os.capture');
const Settings = goog.require('os.config.Settings');
const CanvasRenderer = goog.require('os.ui.capture.CanvasRenderer');


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
