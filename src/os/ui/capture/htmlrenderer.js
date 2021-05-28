goog.module('os.ui.capture.HtmlRenderer');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const ElementRenderer = goog.require('os.ui.capture.ElementRenderer');
const {getMapCanvas} = goog.require('plugin.capture');


/**
 * Renders an HTML element to a canvas.
 *
 * @extends {ElementRenderer<Element>}
 */
class HtmlRenderer extends ElementRenderer {
  /**
   * Constructor.
   * @param {Object=} opt_options Options to configure the renderer
   */
  constructor(opt_options) {
    super(opt_options);

    this.getCanvasElement = opt_options['getCanvasElement'] || getMapCanvas;

    if (opt_options['useRelativePosition']) {
      this.getPosition = this.getRelativePosition;
    }

    this.extraOptions = opt_options['html2canvasOptions'] || {};
  }

  /**
   * @inheritDoc
   */
  getCanvas() {
    return new Promise((resolve, reject) => {
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

        Object.assign(options, this.extraOptions);
        html2canvas(htmlElement, /** @type {html2canvas.Options} */ (options)).then(resolve, reject);
      } else {
        resolve(null);
      }
    });
  }

  /**
   * Get the starting draw position of the canvas as [x, y].
   * @param {!HTMLCanvasElement} canvas The canvas
   * @return {!Array<number>}
   * @protected
   */
  getRelativePosition(canvas) {
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
  }
}

exports = HtmlRenderer;
