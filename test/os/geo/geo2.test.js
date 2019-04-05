
goog.require('ol.proj');
goog.require('os.geo2');
goog.require('os.proj');

describe('os.geo2', function() {
  var projections = [{
    code: os.proj.EPSG4326,
    precision: 12,
    epsilon: 1E-12
  }, {
    code: os.proj.EPSG3857,
    precision: 6,
    epsilon: 1E-6
  }];


  it('should normalize longitudes properly', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var projWidth = projExtent[2] - projExtent[0];
      var min = projExtent[0];
      var max = projExtent[2];
      var chunk = projWidth / 4;

      for (var i = -3; i < 4; i++) { // worlds away
        for (var j = 0; j < 4; j++) { // distance from world left
          var lon = projExtent[0] + i * projWidth + j * chunk;
          var expected = min + j * chunk;

          var result = os.geo2.normalizeLongitude(lon, min, max, proj);

          if (Math.abs(min - result) < config.epsilon) {
            expected = min;
          }

          if (Math.abs(max - result) < config.epsilon) {
            expected = max;
          }

          expect(result).toBeCloseTo(expected, config.precision);
        }
      }
    });
  });


  it('should normalize longitudes to alternate min/max values', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var projWidth = projExtent[2] - projExtent[0];
      var min = projExtent[0] + projWidth / 2;
      var max = min + projWidth;
      var chunk = projWidth / 4;

      for (var i = -3; i < 4; i++) { // worlds away
        for (var j = 0; j < 4; j++) { // distance from world left
          var lon = projExtent[0] + i * projWidth + j * chunk;
          var expected = min + ((j + 2) % 4) * chunk;

          var result = os.geo2.normalizeLongitude(lon, min, max, proj);

          if (Math.abs(min - result) < config.epsilon) {
            expected = min;
          }

          if (Math.abs(max - result) < config.epsilon) {
            expected = max;
          }

          expect(result).toBeCloseTo(expected, config.precision);
        }
      }
    });
  });
});
