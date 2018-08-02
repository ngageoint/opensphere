goog.provide('os.ui.capture.ElementRenderer');

goog.require('goog.Promise');
goog.require('os.capture');



/**
 * Renders an element to the canvas.
 * @param {Object=} opt_options Options to configure the renderer
 * @constructor
 * @template T
 */
os.ui.capture.ElementRenderer = function(opt_options) {
  var options = opt_options || {};

  /**
   * The renderer priority, for sorting. Highest priority will draw first.
   * @type {number}
   */
  this.priority = 0;

  /**
   * @type {?(function():T|string)}
   * @protected
   */
  this.selector = /** @type {function():T|string|undefined} */ (options['selector']) || null;

  /**
   * @type {string}
   */
  this.title = 'unknown';
};


/**
 * Draws content to a canvas.
 * @param {!HTMLCanvasElement} canvas The target canvas
 * @return {!goog.Promise<HTMLCanvasElement>}
 */
os.ui.capture.ElementRenderer.prototype.drawToCanvas = function(canvas) {
  return new goog.Promise(function(resolve, reject) {
    this.getCanvas().then(function(source) {
      if (source) {
        var pos = this.getPosition(canvas);
        this.fillCanvas(canvas, pos[0], pos[1], source.width, source.height);
        this.beforeOverlay();
        os.capture.overlayCanvas(source, canvas, pos[0], pos[1]);
      }

      resolve();
    }, reject, this);
  }, this);
};


/**
 * Get the canvas for this renderer.
 * @return {!goog.Promise<HTMLCanvasElement>}
 */
os.ui.capture.ElementRenderer.prototype.getCanvas = goog.abstractMethod;


/**
 * Perform any necessary actions before overlaying the element on the capture canvas.
 * @protected
 */
os.ui.capture.ElementRenderer.prototype.beforeOverlay = function() {};


/**
 * Get the element to be rendered to the canvas.
 * @return {T}
 * @protected
 */
os.ui.capture.ElementRenderer.prototype.getRenderElement = function() {
  if (typeof this.selector == 'string') {
    return /** @type {T} */ (document.querySelector(this.selector));
  } else if (typeof this.selector == 'function') {
    return this.selector();
  }

  return null;
};


/**
 * Fill a canvas.
 * @param {!HTMLCanvasElement} canvas The canvas to fill
 * @param {number} x The starting x position
 * @param {number} y The starting y position
 * @param {number} width The width to fill
 * @param {number} height The height to fill
 * @protected
 */
os.ui.capture.ElementRenderer.prototype.fillCanvas = function(canvas, x, y, width, height) {
  var fill = this.getFill();
  if (fill) {
    // if an image is provided, repeat it as the background fill
    var ctx = canvas.getContext('2d');
    var fillStyle = fill instanceof Image ? ctx.createPattern(fill, 'repeat') : fill;
    ctx.fillStyle = fillStyle;
    ctx.fillRect(x, y, width, height);
  }
};


/**
 * Get the fill color to use when drawing the canvas.
 * @return {?(Image|string)}
 * @protected
 */
os.ui.capture.ElementRenderer.prototype.getFill = function() {
  return null;
};


/**
 * Get the starting draw position of the canvas as [x, y].
 * @param {!HTMLCanvasElement} canvas The canvas
 * @return {!Array<number>}
 * @protected
 */
os.ui.capture.ElementRenderer.prototype.getPosition = function(canvas) {
  return [0, 0];
};


/**
 * Get the contributing height of the canvas to render, or 0 if this is an overlay.
 * @return {number}
 */
os.ui.capture.ElementRenderer.prototype.getHeight = function() {
  return 0;
};


/**
 * Get the contributing width of the canvas to render, or 0 if this is an overlay.
 * @return {number}
 */
os.ui.capture.ElementRenderer.prototype.getWidth = function() {
  return 0;
};
