goog.provide('os.ui.capture.SvgRenderer');

goog.require('goog.Promise');
goog.require('os.ui.capture.ElementRenderer');



/**
 * Renders an SVG element to a canvas.
 * @param {Object=} opt_options Options to configure the renderer
 * @extends {os.ui.capture.ElementRenderer<Element>}
 * @constructor
 */
os.ui.capture.SvgRenderer = function(opt_options) {
  os.ui.capture.SvgRenderer.base(this, 'constructor', opt_options);
};
goog.inherits(os.ui.capture.SvgRenderer, os.ui.capture.ElementRenderer);


/**
 * @inheritDoc
 */
os.ui.capture.SvgRenderer.prototype.getCanvas = function() {
  return new goog.Promise(function(resolve, reject) {
    var svgElement = this.getRenderElement();
    if (svgElement) {
      svgAsDataUri(svgElement, null, this.onSvgUriReady_.bind(this, resolve, reject));
    } else {
      resolve(null);
    }
  }, this);
};


/**
 * @param {function(HTMLCanvasElement)} resolve The canvas resolve function
 * @param {function(*)} reject The canvas rejection function
 * @param {string=} opt_uri The SVG element data URI
 * @private
 */
os.ui.capture.SvgRenderer.prototype.onSvgUriReady_ = function(resolve, reject, opt_uri) {
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
};


/**
 * @param {function(HTMLCanvasElement)} resolve The canvas resolve function
 * @param {function(*)} reject The canvas rejection function
 * @param {(Image|Error)=} opt_image The loaded SVG image
 * @private
 */
os.ui.capture.SvgRenderer.prototype.onSvgImageReady_ = function(resolve, reject, opt_image) {
  var svgCanvas;
  if (opt_image instanceof Image) {
    svgCanvas = /** @type {!HTMLCanvasElement} */ (document.createElement('canvas'));
    svgCanvas.width = opt_image.width;
    svgCanvas.height = opt_image.height;

    var context = svgCanvas.getContext('2d');
    context.drawImage(opt_image, 0, 0);
  }

  resolve(svgCanvas || null);
};
