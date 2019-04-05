goog.require('ol.proj');
goog.require('os.extent');
goog.require('os.proj');

describe('os.extent', function() {
  var expandExtent = function(extent) {
    return [extent[0], 0, extent[1], 0];
  };

  var projections = [{
    code: os.proj.EPSG4326,
    precision: 12,
    epsilon: 1E-12
  }, {
    code: os.proj.EPSG3857,
    precision: 6,
    epsilon: 1E-6
  }];


  it('should normalize extents', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var left = projExtent[0];
      var right = projExtent[2];
      var width = right - left;
      var center = left + width / 2;
      var min = left;
      var max = min + width;
      var w4 = width / 4;

      var tests = [{
        expected: [left, right],
        extent: [center, width],
        example: '[-180, 180] <- [0, 360]'
      }, {
        expected: [left, center],
        extent: [right, width],
        example: '[-180, 0] <- [180, 360]'
      }, {
        expected: [center, right],
        extent: [center, right],
        example: '[0, 180] <- [0, 180]'
      }, {
        expected: [-w4, w4],
        extent: [center + 3 * w4, center + 5 * w4],
        example: '[-90, 90] <- [270, 540]'
      }];

      for (var i = -3; i < 4; i++) {
        tests.forEach(function(test, testIndex) {
          var e = expandExtent(test.extent);
          e[0] += width * i;
          e[2] += width * i;

          var ex = expandExtent(test.expected);

          var result = os.extent.normalize(e, min, max, proj);

          for (var j = 0; j < 4; j++) {
            expect(result[j]).toBeCloseTo(ex[j], config.precision);

            // if (Math.abs(ex[j] - result[j]) > config.epsilon) {
            //   console.log('test', testIndex, 'at world', i, 'differs at index', j);
            //   console.log(e);
            //   console.log(result);
            //   console.log(ex);
            //   console.log(test.example);
            //   console.log();

            //   debugger;
            //   os.extent.normalize(e, min, max, proj);
            //   break;
            // }
          }
        });
      }
    });
  });

  it('should normalize extents with alternate min/max values', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var left = projExtent[0];
      var right = projExtent[2];
      var width = right - left;
      var center = left + width / 2;
      var min = center;
      var max = min + width;
      var w4 = width / 4;

      var tests = [{
        extent: [left, right],
        expected: [center, width],
        example: '[-180, 180] -> [0, 360]'
      }, {
        extent: [left, center],
        expected: [right, width],
        example: '[-180, 0] -> [180, 360]'
      }, {
        extent: [center, right],
        expected: [center, right],
        example: '[0, 180] -> [0, 180]'
      }, {
        extent: [center, width],
        expected: [center, width],
        example: '[0, 360] -> [0, 360]'
      }, {
        extent: [-w4, w4],
        expected: [center + 3 * w4, center + 5 * w4],
        example: '[-90, 90] -> [270, 540]'
      }];

      for (var i = -3; i < 4; i++) {
        tests.forEach(function(test, testIndex) {
          var e = expandExtent(test.extent);
          e[0] += width * i;
          e[2] += width * i;

          var ex = expandExtent(test.expected);

          var result = os.extent.normalize(e, min, max, proj);

          for (var j = 0; j < 4; j++) {
            expect(result[j]).toBeCloseTo(ex[j], config.precision);

            // if (Math.abs(ex[j] - result[j]) > config.epsilon) {
            //   console.log('test', testIndex, 'at world', i, 'differs at index', j);
            //   console.log(e);
            //   console.log(result);
            //   console.log(ex);
            //   console.log(test.example);
            //   console.log();

            //   debugger;
            //   os.extent.normalize(e, min, max, proj);
            //   break;
            // }
          }
        });
      }
    });
  });


  it('should copy latitude to the result extent', function() {
    var extent = [-180, -90, 180, 90];
    var result = [];
    os.extent.normalize(extent, undefined, undefined, ol.proj.get(os.proj.EPSG4326), result);
    expect(result[1]).toBe(extent[1]);
    expect(result[3]).toBe(extent[3]);
  });


  it('should determine whether or not extents cross the antimeridian', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var left = projExtent[0];
      var right = projExtent[2];
      var width = right - left;
      var center = left + width / 2;
      var smallChunk = width / 360;
      var largeChunk = width / 36;

      var tests = [{
        extent: [left, right],
        expected: false,
        desc: 'full-world'
      }, {
        extent: [left, center],
        expected: false,
        desc: 'left half'
      }, {
        extent: [center, right],
        expected: false,
        desc: 'right half'
      }, {
        extent: [left + smallChunk, center],
        expected: false,
        desc: 'most of left half'
      }, {
        extent: [0, right - smallChunk],
        expected: false,
        desc: 'most of right half'
      }, {
        extent: [left + smallChunk, right - smallChunk],
        expected: false,
        desc: 'most of full-world'
      }, {
        extent: [left - largeChunk, left + largeChunk],
        expected: true,
        desc: 'crosses left'
      }, {
        extent: [right - largeChunk, right + largeChunk],
        expected: true,
        desc: 'crosses right'
      }, {
        extent: [right - largeChunk, left + largeChunk],
        expected: false,
        desc: 'inverted extents are considered empty'
      }];

      for (var i = -3; i < 4; i++) {
        tests.forEach(function(test, testIndex) {
          var e = expandExtent(test.extent);
          e[0] += width * i;
          e[2] += width * i;
          0;
          var normalized = os.extent.normalize(e, undefined, undefined, proj);
          // var result = os.extent.crossesAntimeridian(normalized, proj);
          // if (result !== test.expected) {
          //   console.log('test', testIndex, 'at world', i, 'was', result, 'expected', test.expected);
          //   console.log(e);
          //   console.log(normalized);
          //   console.log(test.desc);
          //   console.log();

          //   debugger;
          //   os.extent.crossesAntimeridian(normalized, proj);
          // }
          expect(os.extent.crossesAntimeridian(normalized, proj)).toBe(test.expected);
        });
      }
    });
  });
});
