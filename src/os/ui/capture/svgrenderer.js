goog.module('os.ui.capture.SvgRenderer');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const ElementRenderer = goog.require('os.ui.capture.ElementRenderer');


/**
 * Renders an SVG element to a canvas.
 *
 * @extends {ElementRenderer<Element>}
 */
class SvgRenderer extends ElementRenderer {
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
    return new Promise((resolve, reject) => {
      var svgElement = this.getRenderElement();
      if (svgElement) {
        svgAsDataUri(svgElement, {
          'scale': os.capture.getPixelRatio()
        }, this.onSvgUriReady_.bind(this, resolve, reject));
      } else {
        resolve(null);
      }
    });
  }

  /**
   * @param {function(HTMLCanvasElement)} resolve The canvas resolve function
   * @param {function(*)} reject The canvas rejection function
   * @param {string=} opt_uri The SVG element data URI
   * @private
   */
  onSvgUriReady_(resolve, reject, opt_uri) {
    if (opt_uri) {
      var image = new Image();
      image.onload = this.onSvgImageReady_.bind(this, resolve, reject, image);

      /**
       * @param {Event} event
       */
      image.onerror = function(event) {
        resolve(null);
      };

      image.src = opt_uri;
    } else {
      resolve(null);
    }
  }

  /**
   * @param {function(HTMLCanvasElement)} resolve The canvas resolve function
   * @param {function(*)} reject The canvas rejection function
   * @param {(Image|Error)=} opt_image The loaded SVG image
   * @private
   */
  onSvgImageReady_(resolve, reject, opt_image) {
    var svgCanvas;
    if (opt_image instanceof Image) {
      svgCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
      svgCanvas.width = opt_image.width;
      svgCanvas.height = opt_image.height;

      var context = svgCanvas.getContext('2d');
      context.drawImage(opt_image, 0, 0);
    }

    resolve(svgCanvas || null);
  }
}

exports = SvgRenderer;
