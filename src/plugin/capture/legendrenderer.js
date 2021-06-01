goog.module('plugin.capture.LegendRenderer');
goog.module.declareLegacyNamespace();

const {getMapCanvas} = goog.require('os.capture');
const config = goog.require('os.config');
const Settings = goog.require('os.config.Settings');
const CanvasRenderer = goog.require('os.ui.capture.CanvasRenderer');


/**
 * Renders the legend to a canvas.
 */
class LegendRenderer extends CanvasRenderer {
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
      x = /** @type {number} */ (Settings.getInstance().get(config.LegendSetting.LEFT, 0));
      y = /** @type {number} */ (Settings.getInstance().get(config.LegendSetting.TOP, 0));
    }

    return [x, y];
  }
}

exports = LegendRenderer;
