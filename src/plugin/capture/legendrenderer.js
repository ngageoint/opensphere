goog.declareModuleId('plugin.capture.LegendRenderer');

import {getMapCanvas} from '../../os/capture/capture.js';
import LegendSetting from '../../os/config/legendsetting.js';
import Settings from '../../os/config/settings.js';
import CanvasRenderer from '../../os/ui/capture/canvasrenderer.js';


/**
 * Renders the legend to a canvas.
 */
export default class LegendRenderer extends CanvasRenderer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.selector = '.js-legend__render-container canvas';
    this.title = 'Legend';
  }

  /**
   * @inheritDoc
   */
  getPosition(canvas) {
    var x;
    var y;

    var mapCanvas = getMapCanvas();
    var legendCanvas = this.getRenderElement();
    if (mapCanvas && legendCanvas) {
      // determine the legend's position over the map
      var mapRect = mapCanvas.getBoundingClientRect();
      var pixelRatio = mapCanvas.width / mapRect.width;

      var legendRect = legendCanvas.getBoundingClientRect();
      x = legendRect.left * pixelRatio;
      y = (legendRect.top - mapRect.top) * pixelRatio;
    } else {
      // default to the settings values, or 0,0 if not present
      x = /** @type {number} */ (Settings.getInstance().get(LegendSetting.LEFT, 0));
      y = /** @type {number} */ (Settings.getInstance().get(LegendSetting.TOP, 0));
    }

    return [x, y];
  }
}
