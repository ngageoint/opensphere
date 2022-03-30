goog.require('os.extent');
goog.require('os.feature.mock');
goog.require('os.geo2');
goog.require('os.mixin.rbush');
goog.require('os.proj');
goog.require('os.source.Vector');

import {intersects} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {get} from 'ol/src/proj.js';
import RBush from 'ol/src/structs/RBush.js';

describe('os.mixin.rbush', function() {
  const {getFeatures} = goog.module.get('os.feature.mock');
  const geo2 = goog.module.get('os.geo2');
  const {default: VectorSource} = goog.module.get('os.source.Vector');
  const {normalizeAntiLeft, normalizeAntiRight} = goog.module.get('os.extent');
  const osMap = goog.module.get('os.map');
  const {EPSG4326} = goog.module.get('os.proj');

  var originalProjection = osMap.PROJECTION;

  beforeEach(function() {
    osMap.setProjection(get(EPSG4326));
  });

  afterEach(function() {
    osMap.setProjection(originalProjection);
  });

  var bruteQuery = function(features, extent) {
    var left = normalizeAntiLeft(extent);
    var right = normalizeAntiRight(extent);

    return features.filter(function(f) {
      var gExtent = f.getGeometry().getExtent();
      return intersects(left, gExtent) || intersects(right, gExtent);
    });
  };

  var mapToId = function(f) {
    return f.id;
  };

  var testExtent = function(rbush, features, extent) {
    var result = rbush.getInExtent(extent).map(mapToId);
    var expected = bruteQuery(features, extent).map(mapToId);

    result.sort();
    expected.sort();

    expect(result).toEqual(expected);
    return result;
  };

  var standardImport = function(rbush, opt_moveToAntimeridian) {
    var features = getFeatures(opt_moveToAntimeridian);

    features.forEach(function(f, i) {
      geo2.normalizeGeometryCoordinates(f.getGeometry());
      rbush.insert(f.getGeometry().getExtent(), f);
    });

    return features;
  };


  it('should query normal items within the extent', function() {
    var rbush = new RBush();
    var features = standardImport(rbush);
    var result = testExtent(rbush, features, [-5, -20, 5, 20]);
    expect(result.length).toBeGreaterThan(0);
  });


  it('should query items around the antimeridian', function() {
    var rbush = new RBush();
    var features = standardImport(rbush, true);

    var left = testExtent(rbush, features, [-185, -20, -175, 20]);
    var right = testExtent(rbush, features, [175, -20, 185, 20]);

    expect(left).toEqual(right);
    expect(left.length).toBeGreaterThan(0);
  });


  it('should query full-world extents', function() {
    var rbush = new RBush();
    var features = standardImport(rbush, true);
    var result = testExtent(rbush, features, [-180, -90, 180, 90]);
    expect(result.length).toBe(features.length);
  });


  it('should query items indexed from right to left', function() {
    var featureLeft = new Feature(new LineString([[-175, 0], [-185, 0]]));
    featureLeft.id = 0;
    var featureRight = new Feature(new LineString([[175, 0], [185, 0]]));
    featureRight.id = 1;
    var features = [featureLeft, featureRight];

    var rbush = new RBush();
    rbush.insert(featureLeft.getGeometry().getExtent(), featureLeft);
    rbush.insert(featureRight.getGeometry().getExtent(), featureRight);

    // try a box covering each end
    var leftLeft = testExtent(rbush, features, [-187, -2, -183, 2]);
    var leftRight = testExtent(rbush, features, [-177, -2, -173, 2]);
    var rightLeft = testExtent(rbush, features, [173, -2, 177, 2]);
    var rightRight = testExtent(rbush, features, [183, -2, 187, 2]);

    expect(leftLeft.length).toBe(2);
    expect(leftRight.length).toBe(2);
    expect(rightLeft.length).toBe(2);
    expect(rightRight.length).toBe(2);

    expect(leftLeft).toEqual(leftRight);
    expect(leftRight).toEqual(rightLeft);
    expect(rightLeft).toEqual(rightRight);
  });

  it('should work with sources', function() {
    var featureLeft = new Feature(new LineString([[-175, 0], [-185, 0]]));
    featureLeft.id = 0;
    var featureRight = new Feature(new LineString([[175, 0], [185, 0]]));
    featureRight.id = 1;
    var features = [featureLeft, featureRight];

    var source = new VectorSource();
    source.addFeatures(features);

    var results = [
      [-187, -2, -183, 2],
      [-177, -2, -173, 2],
      [173, -2, 177, 2],
      [183, -2, 187, 2]
    ].map(function(extent) {
      return source.getFeaturesInGeometry(fromExtent(extent)).map(mapToId);
    });

    for (var i = 0, n = results.length; i < n; i++) {
      expect(results[i].length).toBe(2);

      if (i > 0) {
        expect(results[i]).toEqual(results[i - 1]);
      }
    }
  });
});
