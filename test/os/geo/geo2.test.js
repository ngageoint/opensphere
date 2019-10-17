goog.require('ol.proj');
goog.require('os.feature.mock');
goog.require('os.geo');
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

  var originalProjection = os.map.PROJECTION;
  afterEach(function() {
    os.map.PROJECTION = originalProjection;
  });

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

  it('should clamp latitudes properly', function() {
    projections.forEach(function(config) {
      var proj = ol.proj.get(config.code);
      var projExtent = proj.getExtent();
      var halfHeight = (projExtent[3] - projExtent[1]) / 2;

      expect(os.geo2.normalizeLatitude(projExtent[1] - halfHeight, undefined, undefined, proj)).toBe(projExtent[1]);
      expect(os.geo2.normalizeLatitude(projExtent[1], undefined, undefined, proj)).toBe(projExtent[1]);
      expect(os.geo2.normalizeLatitude(projExtent[1] + halfHeight, undefined, undefined, proj)).
          toBe(projExtent[1] + halfHeight);
      expect(os.geo2.normalizeLatitude(projExtent[3], undefined, undefined, proj)).toBe(projExtent[3]);
      expect(os.geo2.normalizeLatitude(projExtent[3] + halfHeight, undefined, undefined, proj)).toBe(projExtent[3]);
    });
  });


  it('should normalize geometries', function() {
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG4326);
    var features = os.feature.mock.getFeatures(true);

    features.forEach(function(feature) {
      if (geom2 instanceof ol.geom.SimpleGeometry) {
        var geom1 = feature.getGeometry().clone();
        var geom2 = feature.getGeometry().clone();

        var to = os.geo2.normalizeLongitude(geom1.getFlatCoordinates()[0]);
        os.geo.normalizeGeometryCoordinates(geom1, to);
        os.geo2.normalizeGeometryCoordinates(geom2);

        expect(geom2.getFlatCoordinates()).toEqual(geom1.getFlatCoordinates());
      }
    });
  });


  it('should properly compute the area of a ring', function() {
    var ring = [[0,0], [2,0], [2,2], [0,2], [0,0]];
    var csRing = ring.map(function(coord) {
      return {x: coord[0], y: coord[1]};
    });
    expect(os.geo2.computeArea(ring)).toBe(Cesium.PolygonPipeline.computeArea2D(csRing));

    ring = ring.reverse();
    csRing = csRing.reverse();
    expect(os.geo2.computeArea(ring)).toBe(Cesium.PolygonPipeline.computeArea2D(csRing));
  });

  it('should properly compute winding order', function() {
    var ring = [[0, 0], [2,0], [2,2], [0,2], [0,0]];
    expect(os.geo2.computeWindingOrder(ring)).toBe(os.geo2.WindingOrder.COUNTER_CLOCKWISE);

    ring = ring.reverse();
    expect(os.geo2.computeWindingOrder(ring)).toBe(os.geo2.WindingOrder.CLOCKWISE);
  });

});
