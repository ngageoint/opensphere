goog.module('os.ui.capture.CanvasRenderer');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const capture = goog.require('os.capture');
const ElementRenderer = goog.require('os.ui.capture.ElementRenderer');


/**
 * Renders a canvas element to the canvas.
 *
 * @extends {ElementRenderer<HTMLCanvasElement>}
 * @template T
 */
class CanvasRenderer extends ElementRenderer {
  /**
   * Constructor.
   * @param {Object=} opt_options Options to configure the renderer
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * @inheritDoc
   */
  getCanvas() {
    var canvas = this.getRenderElement();
    if (capture.isTainted(canvas)) {
      return Promise.reject('The HTML 2D canvas has been tainted');
    }

    if (canvas) {
      var targetPixelRatio = capture.getPixelRatio();
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

    return Promise.resolve(canvas);
  }
}

exports = CanvasRenderer;
