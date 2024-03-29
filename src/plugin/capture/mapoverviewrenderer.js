goog.declareModuleId('plugin.capture.MapOverviewRenderer');

import {getMapCanvas, getPixelRatio, isTainted} from '../../os/capture/capture.js';
import Settings from '../../os/config/settings.js';
import CanvasRenderer from '../../os/ui/capture/canvasrenderer.js';

const Promise = goog.require('goog.Promise');
const has = goog.require('ol.has');


/**
 * Renders the map overview to a canvas.
 */
export default class MapOverviewRenderer extends CanvasRenderer {
  /**
   * Constructor.
   */
  constructor() {
    super();
    this.title = 'Map Overview';
    this.selector = '.ol-overviewmap:not(.ol-collapsed) canvas';
  }

  /**
   * @inheritDoc
   */
  getCanvas() {
    var canvas = null;
    var original = this.getRenderElement();
    if (isTainted(original)) {
      return Promise.reject('The HTML 2D canvas has been tainted');
    }

    // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
    // pixels do not directly correspond to CSS pixels.

    if (original) {
      // since OpenLayers allows for specifying the pixel ratio on a map (rather than always
      // using window.devicePixelRatio directly), we will calculate it
      var pixelRatio = getPixelRatio();
      var originalRect = original.getBoundingClientRect();
      var origPixelRatio = original.width / originalRect.width;
      var pixelScale = pixelRatio / origPixelRatio;

      // create a new canvas and write the overlay to it
      canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
      canvas.width = original.width * pixelScale;
      canvas.height = original.height * pixelScale;

      var ctx = canvas.getContext('2d');
      var bgColor = Settings.getInstance().get(['bgColor'], '#000');

      // fill with the map background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // copy the overview map canvas to our separate canvas, scaling the image if necessary.
      ctx.drawImage(original,
          0, 0, original.width, original.height,
          0, 0, canvas.width, canvas.height);

      // draw an opaque border to mimic the CSS border
      ctx.strokeStyle = bgColor;
      ctx.lineWidth = 3 * pixelRatio;
      ctx.strokeRect(0, 0, canvas.width, canvas.height);

      // draw the little red dashed region if it exists
      var box = /** @type {HTMLCanvasElement} */ (document.querySelector('.ol-overviewmap-box'));
      if (box) {
        var boxRect = box.getBoundingClientRect();

        // check if the context box is visible
        if (boxRect.height <= originalRect.height && boxRect.width <= originalRect.width) {
          // set up the box style (2px dotted #f00)
          ctx.strokeStyle = '#f00';
          ctx.lineWidth = 2 * pixelRatio;

          if (has.CANVAS_LINE_DASH) {
            ctx.setLineDash([2 * pixelRatio, 2 * pixelRatio]);
          }

          // draw the box
          ctx.strokeRect(
              pixelRatio * (boxRect.left - originalRect.left),
              pixelRatio * (boxRect.top - originalRect.top),
              pixelRatio * boxRect.width,
              pixelRatio * boxRect.height);
        }
      }
    }

    return Promise.resolve(canvas);
  }

  /**
   * @inheritDoc
   */
  getPosition(canvas) {
    var x = 0;
    var y = 0;

    // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
    // pixels do not directly correspond to CSS pixels.
    var mapCanvas = getMapCanvas();
    var overlayCanvas = this.getRenderElement();

    if (mapCanvas && overlayCanvas) {
      // Since OpenLayers allows for specifying the pixel ratio on a map (rather than always
      // using window.devicePixelRatio directly), we will calculate it
      var mapRect = mapCanvas.getBoundingClientRect();
      var pixelRatio = mapCanvas.width / mapRect.width;

      var overlayRect = overlayCanvas.getBoundingClientRect();
      // determine the overlay's position over the map
      x = pixelRatio * (mapRect.right - overlayRect.width - 10);
      y = pixelRatio * 10;
    }

    return [x, y];
  }
}
