goog.provide('os.ui.capture.HtmlRenderer');

goog.require('goog.Promise');
goog.require('os.ui.capture.ElementRenderer');



/**
 * Renders an HTML element to a canvas.
 *
 * @param {Object=} opt_options Options to configure the renderer
 * @extends {os.ui.capture.ElementRenderer<Element>}
 * @constructor
 */
os.ui.capture.HtmlRenderer = function(opt_options) {
  os.ui.capture.HtmlRenderer.base(this, 'constructor', opt_options);
};
goog.inherits(os.ui.capture.HtmlRenderer, os.ui.capture.ElementRenderer);


/**
 * @inheritDoc
 */
os.ui.capture.HtmlRenderer.prototype.getCanvas = function() {
  return new goog.Promise(function(resolve, reject) {
    var htmlElement = this.getRenderElement();
    var mapCanvas = plugin.capture.getMapCanvas();
    if (htmlElement && mapCanvas) {
      var mapRect = mapCanvas.getBoundingClientRect();
      var pixelRatio = mapCanvas.width / mapRect.width;
      html2canvas(htmlElement, /** @type {html2canvas.Options} */ ({
        backgroundColor: null,
        scale: pixelRatio
      })).then(resolve, reject);
    } else {
      resolve(null);
    }
  }, this);
};
