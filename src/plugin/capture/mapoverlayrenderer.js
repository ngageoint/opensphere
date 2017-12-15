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

  if (original) {
    // create a new canvas and write the overlay to it
    canvas = /** @type {HTMLCanvasElement} */ (document.createElement('canvas'));
    canvas.width = original.width;
    canvas.height = original.height;

    var ctx = canvas.getContext('2d');
    var bgColor = os.settings.get(['bgColor'], '#000');

    // fill with the map background color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // overlay the original canvas
    os.capture.overlayCanvas(original, canvas, 0, 0);

    // draw an opaque border
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(canvas.width, 0);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, 0);
    ctx.stroke();

    var box = /** @type {HTMLCanvasElement} */ (document.querySelector('.ol-overviewmap-box'));
    if (box) {
      // check if the context box is visible
      var height = $(box).outerHeight();
      var width = $(box).outerWidth();
      if (height <= original.height && width <= original.width) {
        // determine the box positioning
        var originalRect = original.getBoundingClientRect();
        var boxOffset = $(box).offset();
        var boxX = boxOffset['left'] - originalRect.left;
        var boxY = boxOffset['top'] - originalRect.top;
        var boxExtent = [boxX, boxY, boxX + width, boxY + height];

        // set up the box style (2px dotted #f00)
        ctx.strokeStyle = '#f00';
        ctx.lineWidth = 2;

        if (ol.has.CANVAS_LINE_DASH) {
          ctx.setLineDash([2, 2]);
        }

        // draw the box
        ctx.beginPath();
        ctx.moveTo(boxExtent[0], boxExtent[1]);
        ctx.lineTo(boxExtent[2], boxExtent[1]);
        ctx.lineTo(boxExtent[2], boxExtent[3]);
        ctx.lineTo(boxExtent[0], boxExtent[3]);
        ctx.lineTo(boxExtent[0], boxExtent[1]);
        ctx.stroke();
      }
    }
  }

  return goog.Promise.resolve(canvas);
};


/**
 * @inheritDoc
 */
plugin.capture.MapOverlayRenderer.prototype.getPosition = function(canvas) {
  var x;
  var y;

  var mapCanvas = plugin.capture.getMapCanvas();
  var overlayCanvas = this.getRenderElement();
  if (mapCanvas && overlayCanvas) {
    // determine the overlay's position over the map
    var mapRect = mapCanvas.getBoundingClientRect();
    x = mapRect.right - overlayCanvas.width - 10;
    y = 10;
  } else {
    x = y = 0;
  }

  return [x, y];
};
