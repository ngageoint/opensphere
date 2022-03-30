goog.require('os.ol.image');

import {createCanvasContext2D} from 'ol/src/dom.js';
import {getHeight} from 'ol/src/extent.js';
import ImageCanvas from 'ol/src/ImageCanvas.js';

describe('os.ol.image', function() {
  const image = goog.module.get('os.ol.image');

  var getData = function(imgCanvas) {
    var canvas = imgCanvas.getImage();
    // don't want to deal with separate channels so treat the whole pixel as a single 32bit value
    return new Uint32Array(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data.buffer);
  };

  // Useful for debugging
  // var print = function(imgCanvas) {
  //   var canvas = imgCanvas.getImage();
  //   var data = getData(imgCanvas);

  //   for (var y = 0; y < canvas.height; y++) {
  //     var line = '';
  //     for (var x = 0; x < canvas.width; x++) {
  //       var px = y * canvas.width + x;
  //       line += ' ' + (data[px] ? 'x' : ' ');
  //     }
  //     console.log(line);
  //   }
  // };

  it('should properly rotate images', function() {
    // create the image to rotate
    var ctx = createCanvasContext2D(100, 50);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    var extent = [8, 10, 16, 14];
    var resolution = getHeight(extent) / ctx.canvas.height;
    var original = new ImageCanvas(extent, resolution, 1, ctx.canvas);

    // create the expected image when rotated
    ctx = createCanvasContext2D(50, 100);
    ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    extent = [10, 8, 14, 16];
    var expected = new ImageCanvas(extent, resolution, 1, ctx.canvas);

    // spin it
    var rotated = image.rotate(original, 90);

    // test it
    expect(rotated.getExtent()).toEqual(expected.getExtent());
    expect(rotated.getResolution()).toEqual(expected.getResolution());
    expect(rotated.getImage().width).toBe(expected.getImage().width);
    expect(rotated.getImage().height).toBe(expected.getImage().height);

    var rotatedImageData = getData(rotated);
    var expectedImageData = getData(expected);
    expect(rotatedImageData.length).toBe(expectedImageData.length);
    var diffCount = 0;
    for (var i = 0, n = expectedImageData.length; i < n; i++) {
      if (rotatedImageData[i] != expectedImageData[i]) {
        diffCount++;
      }
    }

    expect(diffCount).toBe(0);
  });
});
