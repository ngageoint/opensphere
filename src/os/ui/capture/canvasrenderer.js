goog.provide('os.ui.capture.CanvasRenderer');

goog.require('goog.Promise');
goog.require('os.capture');
goog.require('os.ui.capture.ElementRenderer');



/**
 * Renders a canvas element to the canvas.
 * @param {Object=} opt_options Options to configure the renderer
 * @extends {os.ui.capture.ElementRenderer<HTMLCanvasElement>}
 * @constructor
 * @template T
 */
os.ui.capture.CanvasRenderer = function(opt_options) {
  os.ui.capture.CanvasRenderer.base(this, 'constructor', opt_options);
};
goog.inherits(os.ui.capture.CanvasRenderer, os.ui.capture.ElementRenderer);


/**
 * @inheritDoc
 */
os.ui.capture.CanvasRenderer.prototype.getCanvas = function() {
  var canvas = this.getRenderElement();
  if (os.capture.isTainted(canvas)) {
    return goog.Promise.reject('The HTML 2D canvas has been tainted');
  }

  if (canvas) {
    var targetPixelRatio = os.capture.getPixelRatio();
    var canvasRect = canvas.getBoundingClientRect();
    var canvasPixelRatio = canvas.width / canvasRect.width;
    if (canvasPixelRatio !== targetPixelRatio) {
      // create a new canvas and write the overlay to it
      var pixelScale = targetPixelRatio / canvasPixelRatio;
      var scaled = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
      scaled.width = canvas.width * pixelScale;
      scaled.height = canvas.height * pixelScale;

      // draw the original to the scaled canvas
      var ctx = scaled.getContext('2d');
      ctx.drawImage(canvas,
          0, 0, canvas.width, canvas.height,
          0, 0, scaled.width, scaled.height);
      canvas = scaled;
    }
  }

  return goog.Promise.resolve(canvas);
};
