goog.provide('os.ol.image');

goog.require('ol.ImageCanvas');
goog.require('ol.dom');
goog.require('ol.extent');


/**
 * Rotates an OL Image about the center of the image's extent by the given value.
 *
 * @param {ol.ImageBase} image
 * @param {number} rotation degrees clockwise
 * @return {ol.ImageCanvas} The rotated image
 */
os.ol.image.rotate = function(image, rotation) {
  var rad = rotation * os.geo.D2R;
  var origExtent = image.getExtent();
  var center = ol.extent.getCenter(origExtent);
  var width = ol.extent.getWidth(origExtent);
  var height = ol.extent.getHeight(origExtent);

  var resolution = image.getResolution();
  var pxWidth = width / resolution;
  var pxHeight = height / resolution;
  var pxWidth2 = pxWidth / 2;
  var pxHeight2 = pxHeight / 2;

  // I couldn't find a way to get the extent of all things drawn to the canvas (not its set size),
  // so calculate it ourselves
  var rotate = os.ol.image.rotate_;
  var coords = [
    rotate(rad, pxWidth2, pxHeight2),
    rotate(rad, -pxWidth2, pxHeight2),
    rotate(rad, -pxWidth2, -pxHeight2),
    rotate(rad, pxWidth2, -pxHeight2)];
  var pxExtent = ol.extent.boundingExtent(coords);

  var ctx = ol.dom.createCanvasContext2D(ol.extent.getWidth(pxExtent), ol.extent.getHeight(pxExtent));

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

  return new ol.ImageCanvas(newExtent, resolution, image.getPixelRatio(), canvas);
};


/**
 * @param {number} rotation
 * @param {number} x
 * @param {number} y
 * @return {Array<number>}
 * @private
 */
os.ol.image.rotate_ = function(rotation, x, y) {
  var sin = Math.sin(rotation);
  var cos = Math.cos(rotation);
  return [x * cos - y * sin, y * cos + x * sin];
};
