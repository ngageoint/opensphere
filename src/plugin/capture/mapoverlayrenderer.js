goog.provide('plugin.capture.MapOverlayRenderer');

goog.require('ol.has');
goog.require('os.ui.capture.CanvasRenderer');
goog.require('plugin.capture.MapRenderer');



/**
 * Renders the legend to a canvas.
 * @extends {os.ui.capture.CanvasRenderer}
 * @constructor
 */
plugin.capture.MapOverlayRenderer = function() {
  plugin.capture.MapOverlayRenderer.base(this, 'constructor');
  this.title = 'Map Overlay';
  this.selector = '.ol-overviewmap:not(.ol-collapsed) canvas';
};
goog.inherits(plugin.capture.MapOverlayRenderer, os.ui.capture.CanvasRenderer);


/**
 * @inheritDoc
 */
plugin.capture.MapOverlayRenderer.prototype.getCanvas = function() {
  var canvas = null;
  var original = this.getRenderElement();
  if (os.capture.isTainted(original)) {
    return goog.Promise.reject('The HTML 2D canvas has been tainted');
  }

  // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
  // pixels do not directly correspond to CSS pixels.

  if (original) {
    // create a new canvas and write the overlay to it
    canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    canvas.width = original.width;
    canvas.height = original.height;

    // since OpenLayers allows for specifying the pixel ratio on a map (rather than always
    // using window.devicePixelRatio directly), we will calculate it
    var originalRect = original.getBoundingClientRect();
    var pixelRatio = canvas.width / originalRect.width;

    var ctx = canvas.getContext('2d');
    var bgColor = os.settings.get(['bgColor'], '#000');

    // fill with the map background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // copy the overview map canvas to our separate canvas
    os.capture.overlayCanvas(original, canvas, 0, 0);

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

        if (ol.has.CANVAS_LINE_DASH) {
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

  return goog.Promise.resolve(canvas);
};


/**
 * @inheritDoc
 */
plugin.capture.MapOverlayRenderer.prototype.getPosition = function(canvas) {
  var x = 0;
  var y = 0;

  // NOTE: For High DPI Displays such as Apple Retina Screens, canvas
  // pixels do not directly correspond to CSS pixels.
  var mapCanvas = plugin.capture.getMapCanvas();
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
};
