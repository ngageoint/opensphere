goog.require('os.feature.mock');
goog.require('os.geo');
goog.require('os.geo2');
goog.require('os.map');
goog.require('os.proj');

import SimpleGeometry from 'ol/src/geom/SimpleGeometry.js';
import {get} from 'ol/src/proj.js';

describe('os.geo2', function() {
  const featureMock = goog.module.get('os.feature.mock');
  const geo = goog.module.get('os.geo');
  const geo2 = goog.module.get('os.geo2');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');

  var projections = [{
    code: osProj.EPSG4326,
    precision: 12,
    epsilon: 1E-12
  }, {
    code: osProj.EPSG3857,
    precision: 6,
    epsilon: 1E-6
  }];

  var originalProjection = osMap.PROJECTION;
  afterEach(function() {
    osMap.setProjection(originalProjection);
  });

  it('should normalize longitudes properly', function() {
    projections.forEach(function(config) {
      var proj = get(config.code);
      var projExtent = proj.getExtent();
      var projWidth = projExtent[2] - projExtent[0];
      var min = projExtent[0];
      var max = projExtent[2];
      var chunk = projWidth / 4;

      for (var i = -3; i < 4; i++) { // worlds away
        for (var j = 0; j < 4; j++) { // distance from world left
          var lon = projExtent[0] + i * projWidth + j * chunk;
          var expected = min + j * chunk;

          var result = geo2.normalizeLongitude(lon, min, max, proj);

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
      var proj = get(config.code);
      var projExtent = proj.getExtent();
      var projWidth = projExtent[2] - projExtent[0];
      var min = projExtent[0] + projWidth / 2;
      var max = min + projWidth;
      var chunk = projWidth / 4;

      for (var i = -3; i < 4; i++) { // worlds away
        for (var j = 0; j < 4; j++) { // distance from world left
          var lon = projExtent[0] + i * projWidth + j * chunk;
          var expected = min + ((j + 2) % 4) * chunk;

          var result = geo2.normalizeLongitude(lon, min, max, proj);

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
      var proj = get(config.code);
      var projExtent = proj.getExtent();
      var halfHeight = (projExtent[3] - projExtent[1]) / 2;

      expect(geo2.normalizeLatitude(projExtent[1] - halfHeight, undefined, undefined, proj)).toBe(projExtent[1]);
      expect(geo2.normalizeLatitude(projExtent[1], undefined, undefined, proj)).toBe(projExtent[1]);
      expect(geo2.normalizeLatitude(projExtent[1] + halfHeight, undefined, undefined, proj)).
          toBe(projExtent[1] + halfHeight);
      expect(geo2.normalizeLatitude(projExtent[3], undefined, undefined, proj)).toBe(projExtent[3]);
      expect(geo2.normalizeLatitude(projExtent[3] + halfHeight, undefined, undefined, proj)).toBe(projExtent[3]);
    });
  });


  it('should normalize geometries', function() {
    osMap.setProjection(get(osProj.EPSG4326));
    var features = featureMock.getFeatures(true);

    features.forEach(function(feature) {
      if (geom2 instanceof SimpleGeometry) {
        var geom1 = feature.getGeometry().clone();
        var geom2 = feature.getGeometry().clone();

        var to = geo2.normalizeLongitude(geom1.getFlatCoordinates()[0]);
        geo.normalizeGeometryCoordinates(geom1, to);
        geo2.normalizeGeometryCoordinates(geom2);

        expect(geom2.getFlatCoordinates()).toEqual(geom1.getFlatCoordinates());
      }
    });
  });


  it('should properly compute the area of a ring', function() {
    var ring = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
    var csRing = ring.map(function(coord) {
      return {x: coord[0], y: coord[1]};
    });
    expect(geo2.computeArea(ring)).toBe(Cesium.PolygonPipeline.computeArea2D(csRing));

    ring = ring.reverse();
    csRing = csRing.reverse();
    expect(geo2.computeArea(ring)).toBe(Cesium.PolygonPipeline.computeArea2D(csRing));
  });

  it('should properly compute winding order', function() {
    var ring = [[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]];
    expect(geo2.computeWindingOrder(ring)).toBe(geo2.WindingOrder.COUNTER_CLOCKWISE);

    ring = ring.reverse();
    expect(geo2.computeWindingOrder(ring)).toBe(geo2.WindingOrder.CLOCKWISE);
  });
});
