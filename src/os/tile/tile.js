goog.provide('os.tile');


/**
 * @typedef {function(Array<number>)}
 */
os.tile.TileFilterFn;


/**
 * Applies a set of filter functions to an image and returns a new, filtered copy.
 * @param {HTMLCanvasElement|Image} image The image to filter
 * @param {Array<Function>} filterFns The filter functions to apply
 * @return {HTMLCanvasElement} A new, filtered copy of the image canvas
 */
os.tile.filterImage = function(image, filterFns) {
  var context = ol.dom.createCanvasContext2D(image.width, image.height);
  context.drawImage(image, 0, 0);

  var canvas = context.canvas;
  var imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  var data = imageData.data;

  // apply each filter function to the image data
  filterFns.forEach(function(fn) {
    fn(data);
  });
  context.putImageData(imageData, 0, 0);
  return canvas;
};
