goog.declareModuleId('os.capture');

import * as webgl from 'ol/src/webgl.js';

import AlertEventSeverity from '../alert/alerteventseverity.js';
import AlertManager from '../alert/alertmanager.js';
import * as config from '../config/config.js';
import {saveFile} from '../file/persist/persist.js';
import Job from '../job/job.js';
import JobEventType from '../job/jobeventtype.js';
import Tile from '../layer/tile.js';
import {WEBGL_CANVAS} from '../map/map.js';
import MapContainer from '../mapcontainer.js';
import {ROOT} from '../os.js';
import * as osString from '../string/string.js';
import * as worker from '../worker.js';
import ContentType from './contenttype.js';

const Promise = goog.require('goog.Promise');
const dispose = goog.require('goog.dispose');
const dom = goog.require('goog.dom');
const log = goog.require('goog.log');

const {default: JobEvent} = goog.requireType('os.job.JobEvent');


/**
 * Identifier for capture plugin components.
 * @type {string}
 */
export const ID = 'capture';

/**
 * Function that returns the canvas
 * @typedef {function():!Promise<HTMLCanvasElement>}
 */
export let CanvasFn;

/**
 * Function that renders the canvas and returns a promise that is resolved when rendering completes.
 * @typedef {function():!Promise}
 */
export let RenderFn;

/**
 * GIF content type
 * @type {string}
 */
export const BASE64_MARKER = ';base64,';

/**
 * Logger
 * @type {log.Logger}
 */
const logger = log.getLogger('os.capture');

/**
 * 2D canvas for creating ImageData objects.
 * @type {HTMLCanvasElement}
 */
export let canvas2d = null;

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
export const getCanvasData = function(opt_canvas, opt_x, opt_y, opt_width, opt_height) {
  var canvas = opt_canvas || document.querySelector('canvas');
  if (canvas instanceof HTMLCanvasElement && !isTainted(canvas)) {
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
      ctx = webgl.getContext(canvas);
      if (ctx) {
        return getWebGLImageData(ctx, x, y, width, height);
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
export const overlayCanvas = function(source, target, x, y) {
  // don't try to write past the bounds of the target canvas. caller should resize/adjust position if necessary.
  var width = Math.min(source.width, target.width - x);
  var height = Math.min(source.height, target.height - y);

  if (height > 0 && width > 0) {
    if (height < source.height || width < source.width) {
      // source will not fit in target canvas and will be cropped
      var msg = 'Canvas overlay cropped by [' + (source.width - width) + ', ' + (source.height - height) + '] pixels.';
      log.warning(logger, msg);
    }

    // manually apply the width and height in this get call in order to crop the source
    var srcImageData = getCanvasData(source, undefined, undefined, width, height);
    // This could happen if the canvas was tainted, we should bail and let elementrenderer.drawToCanvas
    //  reject it's promise so that recorder ui doesn't hang
    if (!srcImageData) {
      return;
    }
    var targetImageData = getCanvasData(target, x, y, width, height);

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
    log.error(logger, msg);
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
export const getWebGLImageData = function(context, x, y, width, height) {
  var pixels = new Uint8Array(width * height * 4);
  context.readPixels(x, y, width, height, context.RGBA, context.UNSIGNED_BYTE, pixels);

  if (!canvas2d) {
    // create a reusable canvas and initialize the 2D context
    canvas2d = (dom.createElement(dom.TagName.CANVAS));
    canvas2d.getContext('2d');
  }

  // not all browsers support the ImageData constructor, so we have to use createImageData.
  var imageData = canvas2d.getContext('2d').createImageData(width, height);

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
export const saveCanvas = function(canvas, opt_fileName) {
  var dataUrl;
  try {
    dataUrl = canvas.toDataURL();
  } catch (e) {
    // TODO (THIN-6294): provide a better explanation/help steps to the user
    var support = /** @type {string} */ (config.getSupportContact('your system administrator'));
    support = osString.linkify(support);
    AlertManager.getInstance().sendAlert('Unable to save canvas due to cross-origin content. Please contact <b>' +
        support + '</b> for support.', AlertEventSeverity.ERROR, logger);
  }

  saveDataUrl(dataUrl, opt_fileName);
};

/**
 * Saves a dataUrl to a PNG
 *
 * This converts the data URL string to a Uint8Array in a Worker. For compiled applications, make sure the worker
 * directory is copied in the build, and worker.DIR is redefined to point to that directory.
 *
 * @param {string} dataUrl png image data url
 * @param {string=} opt_fileName file name
 */
export const saveDataUrl = function(dataUrl, opt_fileName) {
  if (dataUrl) {
    var jobUrl = ROOT + worker.DIR + 'dataurltoarray.js';
    var job = new Job(jobUrl, 'Canvas to Blob', 'Converting canvas data URL to a Blob.');
    job.listenOnce(JobEventType.COMPLETE,
        /**
         * Handle job completion
         *
         * @param {JobEvent} event
         */
        function(event) {
          dispose(event.target);

          if (event.data instanceof Uint8Array) {
            var blob = new Blob([event.data], {type: 'image/png'});
            var filename = (opt_fileName || ('Screenshot ' + getTimestamp())) + '.png';
            saveFile(filename, blob, ContentType.PNG);
          } else {
            AlertManager.getInstance().sendAlert('Failed saving canvas to PNG',
                AlertEventSeverity.ERROR, logger);
          }
        });

    job.listenOnce(JobEventType.ERROR,
        /**
         * Handle job failure
         *
         * @param {JobEvent} event
         */
        function(event) {
          dispose(event.target);

          var msg = typeof event.data === 'string' ? event.data : 'Screen capture failed due to an unspecified error';
          AlertManager.getInstance().sendAlert(msg, AlertEventSeverity.ERROR, logger);
        });

    job.startExecution({
      'dataUrl': dataUrl
    });
  }
};

/**
 * Get the first canvas element encountered in the document.
 *
 * @return {!Promise<HTMLCanvasElement>}
 */
export const getDefaultCanvas = function() {
  var canvas = document.querySelector('canvas');
  return Promise.resolve(canvas instanceof HTMLCanvasElement ? canvas : null);
};

/**
 * Get a timestamp formatted for a file name. Chrome/Firefox will replace colons with either - or _ so they have been
 * omitted from the timestamp.
 *
 * @return {string}
 */
export const getTimestamp = function() {
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
export const isTainted = function(canvas) {
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
 * The current pixel ratio function.
 *
 * @return {number} The pixel ratio for the output canvas.
 */
let getPixelRatio_ = () => 1;

/**
 * Get the pixel ratio for the canvas created by capture. Use setPixelRatioFn to override this function in capture
 * plugins to replace the default behavior.
 *
 * @return {number} The pixel ratio for the output canvas.
 */
export const getPixelRatio = () => getPixelRatio_();

/**
 * Set the function used to get the capture pixel ratio.
 *
 * @param {function():number} fn The new function.
 */
export const setPixelRatioFn = function(fn) {
  getPixelRatio_ = fn;
};

/**
 * Get the map canvas element.
 * @return {HTMLCanvasElement} The map canvas element
 */
export const getMapCanvas = function() {
  var mapCanvas;
  const mapContainer = MapContainer.getInstance();
  if (mapContainer.is3DEnabled()) {
    mapCanvas = /** @type {HTMLCanvasElement} */ (document.querySelector(WEBGL_CANVAS));
  } else {
    const olCanvases = document.querySelectorAll('.ol-layer > canvas');
    let maxWidth = 0;
    let maxHeight = 0;
    for (let i = 0; i < olCanvases.length; i++) {
      if (olCanvases[i].width > maxWidth) {
        maxWidth = olCanvases[i].width;
        maxHeight = olCanvases[i].height;
      }
    }

    const toUse = [];
    for (let i = 0; i < olCanvases.length; i++) {
      if (olCanvases[i].width == maxWidth) {
        toUse.push(olCanvases[i]);
      }
    }

    const layers = mapContainer.getLayers();
    const baseMaps = [];
    for (let i = 0; i < layers.length; i++) {
      if (layers[i] instanceof Tile) {
        baseMaps.push(layers[i]);
      }
    }
    baseMaps.sort((a, b) => (a.getZIndex() < b.getZIndex()) ? -1 : 1);

    mapCanvas = document.querySelector('#js-main > canvas');
    const context = mapCanvas.getContext('2d');
    mapCanvas.width = maxWidth;
    mapCanvas.height = maxHeight;
    for (let i = 0; i < toUse.length; i++) {
      if (i < baseMaps.length) {
        context.globalAlpha = baseMaps[i].getOpacity();
      } else {
        context.globalAlpha = 1;
      }
      context.drawImage(toUse[i], 0, 0, maxWidth, maxHeight);
    }
  }

  return mapCanvas;
};

/**
 * Get the map canvas pixel ratio.
 * @return {number} The map canvas pixel ratio.
 */
export const getMapPixelRatio = function() {
  var mapCanvas = getMapCanvas();
  if (mapCanvas) {
    var mapRect = mapCanvas.getBoundingClientRect();
    return mapCanvas.width / mapRect.width;
  }

  return 1;
};
