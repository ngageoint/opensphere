goog.provide('os.capture');
goog.provide('os.capture.CaptureEventType');
goog.provide('os.capture.ContentType');
goog.provide('os.capture.gif');
goog.provide('os.capture.gif.EventType');

goog.require('goog.Promise');
goog.require('goog.dom');
goog.require('goog.log');
goog.require('ol.webgl');
goog.require('os.config');
goog.require('os.defines');
goog.require('os.file.persist.FilePersistence');
goog.require('os.job.Job');
goog.require('os.string');
goog.require('os.worker');


/**
 * Identifier for capture plugin components.
 * @type {string}
 * @const
 */
os.capture.ID = 'capture';


/**
 * GIF content type
 * @enum {string}
 * @const
 */
os.capture.ContentType = {
  GIF: 'image/gif',
  PNG: 'image/png'
};


/**
 * Recording event types
 * @enum {string}
 */
os.capture.CaptureEventType = {
  STATUS: 'capture:status',
  UNBLOCK: 'capture:unblock',
  PROGRESS: 'capture:progress',
  COMPLETE: 'capture:complete',
  ERROR: 'capture:error'
};


/**
 * Function that returns the canvas
 * @typedef {function():!goog.Promise<HTMLCanvasElement>}
 */
os.capture.CanvasFn;


/**
 * Function that renders the canvas and returns a promise that is resolved when rendering completes.
 * @typedef {function():!goog.Promise}
 */
os.capture.RenderFn;


/**
 * GIF content type
 * @type {string}
 * @const
 */
os.capture.BASE64_MARKER = ';base64,';


/**
 * Events fired by the GIF library.
 * @enum {string}
 */
os.capture.gif.EventType = {
  ABORT: 'abort',
  FINISHED: 'finished',
  PROGRESS: 'progress',
  START: 'start'
};


/**
 * Path to the worker script used by the GIF library.
 * @type {string}
 * @const
 */
os.capture.gif.WORKER_SCRIPT = os.ROOT + 'vendor/gif/gif.worker.js';


/**
 * Logger
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.capture.LOGGER_ = goog.log.getLogger('os.capture');


/**
 * 2D canvas for creating ImageData objects.
 * @type {HTMLCanvasElement}
 */
os.capture.canvas2d = null;


/**
 * Gets the current image data from a canvas. The canvas must have an initialized rendering context.
 *
 * To use this function with WebGL, you must either initialize the context with the preserveDrawingBuffer flag set to
 * true, or ensure this is called immediately after rendering a frame. The flag allows readPixels to work all of the
 * time, but is known to cause rendering artifacts and potential performance problems.
 *
 * @see THIN-6285
 *
 * @param {HTMLCanvasElement=} opt_canvas The canvas to use
 * @param {number=} opt_x Start x coordinate
 * @param {number=} opt_y Start y coordinate
 * @param {number=} opt_width Pixel width to retrieve
 * @param {number=} opt_height Pixel height to retrieve
 * @return {ImageData}
 */
os.capture.getCanvasData = function(opt_canvas, opt_x, opt_y, opt_width, opt_height) {
  var canvas = opt_canvas || document.querySelector('canvas');
  if (canvas instanceof HTMLCanvasElement && !os.capture.isTainted(canvas)) {
    var x = opt_x || 0;
    var y = opt_y || 0;
    var width = opt_width != null ? opt_width : canvas.width;
    var height = opt_height != null ? opt_height : canvas.height;
    var ctx = canvas.getContext('2d');
    if (ctx) {
      // 2d rendering context
      return ctx.getImageData(x, y, width, height);
    } else {
      // not a 2d rendering context, try webgl
      ctx = ol.webgl.getContext(canvas);
      if (ctx) {
        return os.capture.getWebGLImageData(ctx, x, y, width, height);
      }
    }
  }

  return null;
};


/**
 * Overlay a source canvas on top of a target canvas.
 *
 * @param {!HTMLCanvasElement} source The source canvas
 * @param {!HTMLCanvasElement} target The target canvas
 * @param {number} x The starting x position on the target canvas
 * @param {number} y The starting y position on the target canvas
 */
os.capture.overlayCanvas = function(source, target, x, y) {
  // don't try to write past the bounds of the target canvas. caller should resize/adjust position if necessary.
  var width = Math.min(source.width, target.width - x);
  var height = Math.min(source.height, target.height - y);

  if (height > 0 && width > 0) {
    if (height < source.height || width < source.width) {
      // source will not fit in target canvas and will be cropped
      var msg = 'Canvas overlay cropped by [' + (source.width - width) + ', ' + (source.height - height) + '] pixels.';
      goog.log.warning(os.capture.LOGGER_, msg);
    }

    // manually apply the width and height in this get call in order to crop the source
    var srcImageData = os.capture.getCanvasData(source, undefined, undefined, width, height);
    // This could happen if the canvas was tainted, we should bail and let elementrenderer.drawToCanvas
    //  reject it's promise so that recorder ui doesn't hang
    if (!srcImageData) {
      return;
    }
    var targetImageData = os.capture.getCanvasData(target, x, y, width, height);

    var targetData = targetImageData.data;
    var sourceData = srcImageData.data;
    for (var i = 0; i < sourceData.length; i += 4) {
      var alpha = sourceData[i + 3] / 255;

      // if source alpha is 0, don't bother doing anything
      if (alpha > 0) {
        if (alpha < 1) {
          // if the source pixel is semi-transparent, alpha blend source/target colors
          targetData[i] = Math.round(sourceData[i] * alpha + (1 - alpha) * targetData[i]);
          targetData[i + 1] = Math.round(sourceData[i + 1] * alpha + (1 - alpha) * targetData[i + 1]);
          targetData[i + 2] = Math.round(sourceData[i + 2] * alpha + (1 - alpha) * targetData[i + 2]);
        } else {
          // source pixel is opaque, so replace the target
          targetData[i] = sourceData[i];
          targetData[i + 1] = sourceData[i + 1];
          targetData[i + 2] = sourceData[i + 2];
          targetData[i + 3] = sourceData[i + 3];
        }
      }
    }

    // now write the combined image back to the canvas
    var targetCtx = target.getContext('2d');
    targetCtx.putImageData(targetImageData, x, y);
  } else {
    // x and/or y outside target canvas
    var msg = 'Unable to overlay canvas: height = ' + height + ', width = ' + width + '.';
    goog.log.error(os.capture.LOGGER_, msg);
  }
};


/**
 * Get the WebGL context pixels as an ImageData object.
 *
 * If you get black images back, see the comment in os.capture.getCanvasData.
 *
 * @param {WebGLRenderingContext} context The WebGL context
 * @param {number} x Start x coordinate
 * @param {number} y Start y coordinate
 * @param {number} width The canvas width
 * @param {number} height The canvas height
 * @return {ImageData}
 */
os.capture.getWebGLImageData = function(context, x, y, width, height) {
  var pixels = new Uint8Array(width * height * 4);
  context.readPixels(x, y, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);

  if (!os.capture.canvas2d) {
    // create a reusable canvas and initialize the 2D context
    os.capture.canvas2d = /** @type {!HTMLCanvasElement} */ (goog.dom.createElement(goog.dom.TagName.CANVAS));
    os.capture.canvas2d.getContext('2d');
  }

  // not all browsers support the ImageData constructor, so we have to use createImageData.
  var imageData = os.capture.canvas2d.getContext('2d').createImageData(width, height);

  // webgl pixel buffer is flipped, so unflip it and write to the imageData buffer
  var data = imageData.data;
  for (x = 0; x < width; x++) {
    for (y = 0; y < height; y++) {
      var i = 4 * (x + width * y);
      var j = 4 * (x + width * (height - y - 1));
      data[i++] = pixels[j++];
      data[i++] = pixels[j++];
      data[i++] = pixels[j++];
      data[i] = pixels[j];
    }
  }

  return imageData;
};


/**
 * Saves a canvas to a PNG. WebGL renderers *must* be initialized with preserveDrawingBuffer: true, or canvas.toDataURL
 * will not be supported and will likely return a blank image.
 *
 * If you get black images back, see the comment in os.capture.getCanvasData. The same rule applies to toDataURL.
 *
 * @param {!HTMLCanvasElement} canvas The canvas to save
 * @param {string=} opt_fileName The file name of the screenshot
 */
os.capture.saveCanvas = function(canvas, opt_fileName) {
  var dataUrl;
  try {
    dataUrl = canvas.toDataURL();
  } catch (e) {
    // TODO (THIN-6294): provide a better explanation/help steps to the user
    var support = /** @type {string} */ (os.config.getSupportContact('your system administrator'));
    support = os.string.linkify(support);
    os.alertManager.sendAlert('Unable to save canvas due to cross-origin content. Please contact <b>' + support +
        '</b> for support.', os.alert.AlertEventSeverity.ERROR, os.capture.LOGGER_);
  }

  os.capture.saveDataUrl(dataUrl, opt_fileName);
};


/**
 * Saves a dataUrl to a PNG
 *
 * This converts the data URL string to a Uint8Array in a Worker. For compiled applications, make sure the worker
 * directory is copied in the build, and os.worker.DIR is redefined to point to that directory.
 *
 * @param {string} dataUrl png image data url
 * @param {string=} opt_fileName file name
 */
os.capture.saveDataUrl = function(dataUrl, opt_fileName) {
  if (dataUrl) {
    var jobUrl = os.ROOT + os.worker.DIR + 'dataurltoarray.js';
    var job = new os.job.Job(jobUrl, 'Canvas to Blob', 'Converting canvas data URL to a Blob.');
    job.listenOnce(os.job.JobEventType.COMPLETE,
        /**
         * Handle job completion
         *
         * @param {os.job.JobEvent} event
         */
        function(event) {
          goog.dispose(event.target);

          if (event.data instanceof Uint8Array) {
            var blob = new Blob([event.data], {type: 'image/png'});
            var filename = (opt_fileName || ('Screenshot ' + os.capture.getTimestamp())) + '.png';
            os.file.persist.saveFile(filename, blob, os.capture.ContentType.PNG);
          } else {
            os.alertManager.sendAlert('Failed saving canvas to PNG',
                os.alert.AlertEventSeverity.ERROR, os.capture.LOGGER_);
          }
        });

    job.listenOnce(os.job.JobEventType.ERROR,
        /**
         * Handle job failure
         *
         * @param {os.job.JobEvent} event
         */
        function(event) {
          goog.dispose(event.target);

          var msg = typeof event.data === 'string' ? event.data : 'Screen capture failed due to an unspecified error';
          os.alertManager.sendAlert(msg, os.alert.AlertEventSeverity.ERROR, os.capture.LOGGER_);
        });

    job.startExecution({
      'dataUrl': dataUrl
    });
  }
};


/**
 * Get the first canvas element encountered in the document.
 *
 * @return {!goog.Promise<HTMLCanvasElement>}
 */
os.capture.getDefaultCanvas = function() {
  var canvas = document.querySelector('canvas');
  return goog.Promise.resolve(canvas instanceof HTMLCanvasElement ? canvas : null);
};


/**
 * Get a timestamp formatted for a file name. Chrome/Firefox will replace colons with either - or _ so they have been
 * omitted from the timestamp.
 *
 * @return {string}
 */
os.capture.getTimestamp = function() {
  return moment().format('YYYY-MM-DD_HHmmss');
};


/**
 * Determines if the 2D canvas context is tainted
 *
 * Tainting can happen for a number of reasons including trying to use the canvas to
 * render an image from a server with CORS issues
 *
 * @see THIN-8273
 *
 * @param {HTMLCanvasElement} canvas
 * @return {boolean}
 */
os.capture.isTainted = function(canvas) {
  if (canvas) {
    var ctx = canvas.getContext('2d');
    if (ctx instanceof CanvasRenderingContext2D) {
      try {
        ctx.getImageData(0, 0, 1, 1);
      } catch (e) {
        // An error here means that the canvas context is tainted
        return true;
      }
    }
  }
  return false;
};


/**
 * Get the pixel ratio for the canvas created by capture. Override this function in capture plugins to replace the
 * default behavior.
 *
 * @return {number} The pixel ratio for the output canvas.
 */
os.capture.getPixelRatio = function() {
  return 1;
};
