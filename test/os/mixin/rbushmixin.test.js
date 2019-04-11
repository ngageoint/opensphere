goog.require('ol.proj');
goog.require('os.extent');
goog.require('os.feature.mock');
goog.require('os.geo2');
goog.require('os.mixin.rbush');
goog.require('os.proj');


describe('os.mixin.rbush', function() {
  var originalProjection = os.map.PROJECTION;

  beforeEach(function() {
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG4326);
  });

  afterEach(function() {
    os.map.PROJECTION = originalProjection;
  });

  var bruteQuery = function(features, extent) {
    var left = os.extent.normalizeAntiLeft(extent);
    var right = os.extent.normalizeAntiRight(extent);

    return features.filter(function(f) {
      var gExtent = f.getGeometry().getExtent();
      return ol.extent.intersects(left, gExtent) || ol.extent.intersects(right, gExtent);
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
    var features = os.feature.mock.getFeatures(opt_moveToAntimeridian);

    features.forEach(function(f, i) {
      os.geo2.normalizeGeometryCoordinates(f.getGeometry());
      rbush.insert(f.getGeometry().getExtent(), f);
    });

    return features;
  };


  it('should query normal items within the extent', function() {
    var rbush = new ol.structs.RBush();
    var features = standardImport(rbush);
    var result = testExtent(rbush, features, [-5, -20, 5, 20]);
    expect(result.length).toBeGreaterThan(0);
  });


  it('should query items around the antimeridian', function() {
    var rbush = new ol.structs.RBush();
    var features = standardImport(rbush, true);

    var left = testExtent(rbush, features, [-185, -20, -175, 20]);
    var right = testExtent(rbush, features, [175, -20, 185, 20]);

    expect(left).toEqual(right);
    expect(left.length).toBeGreaterThan(0);
  });


  it('should query full-world extents', function() {
    var rbush = new ol.structs.RBush();
    var features = standardImport(rbush, true);
    var result = testExtent(rbush, features, [-180, -90, 180, 90]);
    expect(result.length).toBe(features.length);
  });
});
