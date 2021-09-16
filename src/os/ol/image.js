goog.module('os.ol.image');

const ImageCanvas = goog.require('ol.ImageCanvas');
const {createCanvasContext2D} = goog.require('ol.dom');
const olExtent = goog.require('ol.extent');
const {D2R} = goog.require('os.geo');

const ImageBase = goog.requireType('ol.ImageBase');


/**
 * Rotates an OL Image about the center of the image's extent by the given value.
 *
 * @param {ImageBase} image
 * @param {number} rotation degrees clockwise
 * @return {ImageCanvas} The rotated image
 */
const rotate = function(image, rotation) {
  var rad = rotation * D2R;
  var origExtent = image.getExtent();
  var center = olExtent.getCenter(origExtent);
  var width = olExtent.getWidth(origExtent);
  var height = olExtent.getHeight(origExtent);

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
  var pxExtent = olExtent.boundingExtent(coords);

  var ctx = createCanvasContext2D(olExtent.getWidth(pxExtent), olExtent.getHeight(pxExtent));

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

exports = {
  rotate
};
