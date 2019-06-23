goog.provide('os.ui.capture.HtmlRenderer');

goog.require('goog.Promise');
goog.require('os.ui.capture.ElementRenderer');



/**
 * Renders an HTML element to a canvas.
 * @param {Object=} opt_options Options to configure the renderer
 * @extends {os.ui.capture.ElementRenderer<Element>}
 * @constructor
 */
os.ui.capture.HtmlRenderer = function(opt_options) {
  os.ui.capture.HtmlRenderer.base(this, 'constructor', opt_options);

  this.getCanvasElement = opt_options['getCanvasElement'] || plugin.capture.getMapCanvas;

  if (opt_options['useRelativePosition']) {
    this.getPosition = this.getRelativePosition;
  }

  this.extraOptions = opt_options['html2canvasOptions'] || {};
};
goog.inherits(os.ui.capture.HtmlRenderer, os.ui.capture.ElementRenderer);


/**
 * @inheritDoc
 */
os.ui.capture.HtmlRenderer.prototype.getCanvas = function() {
  return new goog.Promise(function(resolve, reject) {
    var htmlElement = this.getRenderElement();
    var canvas = this.getCanvasElement();
    if (htmlElement && canvas) {
      var rect = canvas.getBoundingClientRect();
      var pixelRatio = canvas.width / rect.width;
      var options = {
        backgroundColor: null,
        canvas: canvas,
        scale: pixelRatio
      };

      goog.object.extend(options, this.extraOptions);
      html2canvas(htmlElement, /** @type {html2canvas.Options} */ (options)).then(resolve, reject);
    } else {
      resolve(null);
    }
  }, this);
};


/**
 * Get the starting draw position of the canvas as [x, y].
 * @param {!HTMLCanvasElement} canvas The canvas
 * @return {!Array<number>}
 * @protected
 */
os.ui.capture.HtmlRenderer.prototype.getRelativePosition = function(canvas) {
  var x = 0;
  var y = 0;

  // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
  // pixels do not directly correspond to CSS pixels.
  var referenceCanvas = this.getCanvasElement();
  var htmlElement = this.getRenderElement();

  if (htmlElement && referenceCanvas) {
    // Since OpenLayers allows for specifying the pixel ratio on a map (rather than always
    // using window.devicePixelRatio directly), we will calculate it
    var rect = referenceCanvas.getBoundingClientRect();
    var pixelRatio = referenceCanvas.width / rect.width;

    var overlayRect = htmlElement.getBoundingClientRect();
    // determine the overlay's position over the map
    x = pixelRatio * overlayRect.x;
    y = pixelRatio * (overlayRect.y - rect.y);
  }

  return [x, y];
};
