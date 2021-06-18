goog.module('os.ui.capture.ElementRenderer');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const capture = goog.require('os.capture');


/**
 * Renders an element to the canvas.
 *
 * @abstract
 * @template T
 */
class ElementRenderer {
  /**
   * Constructor.
   * @param {Object=} opt_options Options to configure the renderer
   */
  constructor(opt_options) {
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
  }

  /**
   * Draws content to a canvas.
   *
   * @param {!HTMLCanvasElement} canvas The target canvas
   * @return {!Promise<HTMLCanvasElement>}
   */
  drawToCanvas(canvas) {
    return new Promise((resolve, reject) => {
      this.getCanvas().then((source) => {
        if (source) {
          var pos = this.getPosition(canvas);
          this.fillCanvas(canvas, pos[0], pos[1], source.width, source.height);
          this.beforeOverlay();
          capture.overlayCanvas(source, canvas, pos[0], pos[1]);
        }

        resolve();
      }, reject, this);
    });
  }

  /**
   * Get the canvas for this renderer.
   *
   * @abstract
   * @return {!Promise<HTMLCanvasElement>}
   */
  getCanvas() {}

  /**
   * Perform any necessary actions before overlaying the element on the capture canvas.
   *
   * @protected
   */
  beforeOverlay() {}

  /**
   * Get the element to be rendered to the canvas.
   *
   * @return {T}
   * @protected
   */
  getRenderElement() {
    if (typeof this.selector == 'string') {
      return /** @type {T} */ (document.querySelector(this.selector));
    } else if (typeof this.selector == 'function') {
      return this.selector();
    }

    return null;
  }

  /**
   * Fill a canvas.
   *
   * @param {!HTMLCanvasElement} canvas The canvas to fill
   * @param {number} x The starting x position
   * @param {number} y The starting y position
   * @param {number} width The width to fill
   * @param {number} height The height to fill
   * @protected
   */
  fillCanvas(canvas, x, y, width, height) {
    var fill = this.getFill();
    if (fill) {
      // if an image is provided, repeat it as the background fill
      var ctx = canvas.getContext('2d');
      var fillStyle = fill instanceof Image ? ctx.createPattern(fill, 'repeat') : fill;
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x, y, width, height);
    }
  }

  /**
   * Get the fill color to use when drawing the canvas.
   *
   * @return {?(Image|string)}
   * @protected
   */
  getFill() {
    return null;
  }

  /**
   * Get the starting draw position of the canvas as [x, y].
   *
   * @param {!HTMLCanvasElement} canvas The canvas
   * @return {!Array<number>}
   * @protected
   */
  getPosition(canvas) {
    return [0, 0];
  }

  /**
   * Get the contributing height of the canvas to render, or 0 if this is an overlay.
   *
   * @return {number}
   */
  getHeight() {
    return 0;
  }

  /**
   * Get the contributing width of the canvas to render, or 0 if this is an overlay.
   *
   * @return {number}
   */
  getWidth() {
    return 0;
  }
}

exports = ElementRenderer;
