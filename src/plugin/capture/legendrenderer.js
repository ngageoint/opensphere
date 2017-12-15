goog.provide('plugin.capture.LegendRenderer');

goog.require('os.config.LegendSettings');
goog.require('os.ui.capture.CanvasRenderer');
goog.require('plugin.capture.MapRenderer');



/**
 * Renders the legend to a canvas.
 * @extends {os.ui.capture.CanvasRenderer}
 * @constructor
 */
plugin.capture.LegendRenderer = function() {
  plugin.capture.LegendRenderer.base(this, 'constructor');
  this.selector = '.c-legend.c--widget canvas';
  this.title = 'Legend';
};
goog.inherits(plugin.capture.LegendRenderer, os.ui.capture.CanvasRenderer);


/**
 * @inheritDoc
 */
plugin.capture.LegendRenderer.prototype.getPosition = function(canvas) {
  var x;
  var y;

  var mapCanvas = plugin.capture.getMapCanvas();
  var legendCanvas = this.getRenderElement();
  if (mapCanvas && legendCanvas) {
    // determine the legend's position over the map
    var mapRect = mapCanvas.getBoundingClientRect();
    var legendRect = legendCanvas.getBoundingClientRect();
    x = legendRect.left;
    y = legendRect.top - mapRect.top;
  } else {
    // default to the settings values, or 0,0 if not present
    x = /** @type {number} */ (os.settings.get(os.config.LegendSetting.LEFT, 0));
    y = /** @type {number} */ (os.settings.get(os.config.LegendSetting.TOP, 0));
  }

  return [x, y];
};
