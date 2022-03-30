goog.declareModuleId('os.ol.image');

import {createCanvasContext2D} from 'ol/src/dom.js';
import {boundingExtent, getCenter, getWidth, getHeight} from 'ol/src/extent.js';
import ImageCanvas from 'ol/src/ImageCanvas.js';

import {D2R} from '../geo/geo.js';

/**
 * Rotates an OL Image about the center of the image's extent by the given value.
 *
 * @param {ImageBase} image
 * @param {number} rotation degrees clockwise
 * @return {ImageCanvas} The rotated image
 */
export const rotate = function(image, rotation) {
  var rad = rotation * D2R;
  var origExtent = image.getExtent();
  var center = getCenter(origExtent);
  var width = getWidth(origExtent);
  var height = getHeight(origExtent);

  var resolution = image.getResolution();
  var pxWidth = width / resolution;
  var pxHeight = height / resolution;
  var pxWidth2 = pxWidth / 2;
  var pxHeight2 = pxHeight / 2;

  // I couldn't find a way to get the extent of all things drawn to the canvas (not its set size),
  // so calculate it ourselves
  var rotate = rotate_;
  var coords = [
    rotate(rad, pxWidth2, pxHeight2),
    rotate(rad, -pxWidth2, pxHeight2),
    rotate(rad, -pxWidth2, -pxHeight2),
    rotate(rad, pxWidth2, -pxHeight2)];
  var pxExtent = boundingExtent(coords);

  var ctx = createCanvasContext2D(getWidth(pxExtent), getHeight(pxExtent));

  var canvas = ctx.canvas;
  var newWidth2 = canvas.width / 2;
  var newHeight2 = canvas.height / 2;
  ctx.translate(newWidth2, newHeight2);
  ctx.rotate(rad);
  ctx.drawImage(image.getImage(), -pxWidth2, -pxHeight2);

  var deltaX = newWidth2 * resolution;
  var deltaY = newHeight2 * resolution;

  var newExtent = [
    center[0] - deltaX,
    center[1] - deltaY,
    center[0] + deltaX,
    center[1] + deltaY];

  return new ImageCanvas(newExtent, resolution, image.getPixelRatio(), canvas);
};

/**
 * @param {number} rotation
 * @param {number} x
 * @param {number} y
 * @return {Array<number>}
 */
const rotate_ = function(rotation, x, y) {
  var sin = Math.sin(rotation);
  var cos = Math.cos(rotation);
  return [x * cos - y * sin, y * cos + x * sin];
};
