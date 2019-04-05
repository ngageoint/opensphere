goog.require('ol.proj');
goog.require('os.extent');
goog.require('os.mixin.rbush');
goog.require('os.proj');
goog.require('plugin.file.geojson.GeoJSONParser');


describe('os.mixin.rbush', function() {
  var geoms = [{
    'coordinates': [0.0, 0.0],
    'type': 'Point'
  }, {
    'coordinates': [[0.0, 5.0], [5.0, 5.0], [10.0, 5.0]],
    'type': 'MultiPoint'
  }, {
    'coordinates': [[0.0, 10.0], [10.0, 10.0]],
    'type': 'LineString'
  }, {
    'coordinates': [[
          [0.0, 15.0], [5.0, 15.0]], [[10.0, 15.0], [15.0, 15.0]],
          [[20.0, 15.0], [25.0, 15.0]]],
    'type': 'MultiLineString'
  }, {
    'coordinates': [[[0.0, 20.0], [5.0, 20.0], [5.0, 22.0], [0.0, 22.0], [0.0, 20.0]]],
    'type': 'Polygon'
  }, {
    'coordinates': [[[10.0, 20.0], [15.0, 20.0], [15.0, 22.0], [10.0, 22.0], [10.0, 20.0]],
      [[11.0, 20.5], [14.0, 20.5], [14.0, 21.5],
          [11.0, 21.5], [11.0, 20.5]]],
    'type': 'Polygon'
  }, {
    'coordinates': [[[[0.0, 25.0], [5.0, 25.0], [5.0, 30.0], [0.0, 25.0]]],
          [[[10.0, 25.0], [15.0, 25.0], [15.0, 30.0], [10.0, 25.0]]]],
    'type': 'MultiPolygon'
  }, {
    'coordinates': [[[[20.0, 25.0], [25.0, 25.0], [25.0, 30.0], [20.0, 25.0]],
          [[21.5, 25.5], [24.5, 25.5], [24.5, 28.5], [21.5, 25.5]]],
    [[[30.0, 25.0], [35.0, 25.0], [35.0, 30.0], [30.0, 25.0]],
          [[31.5, 25.5], [34.5, 25.5], [34.5, 28.5], [31.5, 25.5]]]],
    'type': 'MultiPolygon'
  }, {
    'geometries': [{
      'coordinates': [50.0, 0.0],
      'type': 'Point'
    }, {
      'coordinates': [[50.0, 5.0], [55.0, 5.0], [60.0, 5.0]],
      'type': 'MultiPoint'
    }, {
      'coordinates': [[50.0, 10.0], [60.0, 10.0]],
      'type': 'LineString'
    }, {
      'coordinates': [[[50.0, 20.0], [55.0, 20.0], [55.0, 22.0], [50.0, 22.0], [50.0, 20.0]]],
      'type': 'Polygon'
    }, {
      'coordinates': [[[60.0, 20.0], [65.0, 20.0], [65.0, 22.0], [60.0, 22.0], [60.0, 20.0]],
              [[61.0, 20.5], [64.0, 20.5], [64.0, 21.5], [61.0, 21.5], [61.0, 20.5]]],
      'type': 'Polygon'
    }],
    'type': 'GeometryCollection'
  }];

  var features = [];

  var originalProjection = os.map.PROJECTION;

  beforeEach(function() {
    os.map.PROJECTION = ol.proj.get(os.proj.EPSG4326);
  });

  afterEach(function() {
    os.map.PROJECTION = originalProjection;
  });


  var bruteQuery = function(extent) {
    var left = os.extent.normalizeAntiLeft(extent);
    var right = os.extent.normalizeAntiRight(extent);

    return features.filter(function(f) {
      var geom = f.getGeometry();
      return geom && (geom.intersectsExtent(left) || geom.intersectsExtent(right));
    });
  };

  var mapToId = function(f) {
    return f.id;
  };

  var testExtent = function(rbush, extent) {
    var result = rbush.getInExtent(extent).map(mapToId);
    var expected = bruteQuery(extent).map(mapToId);

    result.sort();
    expected.sort();

    expect(result).toEqual(expected);
    return result;
  };

  var standardImport = function(rbush, opt_source) {
    features.length = 0;
    opt_source = opt_source || geoms;
    var p = new plugin.file.geojson.GeoJSONParser();
    p.setSource(opt_source);
    while (p.hasNext()) {
      Array.prototype.push.apply(features, p.parseNext());
    }

    features.forEach(function(f, i) {
      f.id = i;
      rbush.insert(f.getGeometry().getExtent(), f);
    });
  };

  var cloneOrReturn = function(val) {
    return /^(number|string|boolean)$/.test(typeof val) ? val : clone(val);
  };

  var clone = function(obj) {
    var c;
    if (Array.isArray(obj)) {
      c = obj.map(cloneOrReturn);
    } else {
      c = {};
      for (var key in obj) {
        c[key] = cloneOrReturn(obj[key]);
      }
    }

    return c;
  };

  var antimeridian = function(obj, offset, lastOffset) {
    lastOffset = lastOffset === undefined ? 175 : lastOffset;

    if (offset === undefined && 'type' in obj) {
      offset = lastOffset < 0 ? 175 : -185;
    }

    if (Array.isArray(obj)) {
      if (obj.length && typeof obj[0] === 'number') {
        obj[0] += offset;
      } else {
        for (var i = 0, n = obj.length; i < n; i++) {
          antimeridian(obj[i], offset, lastOffset);
        }
      }
    } else if (!/^(number|string|boolean)$/.test(typeof obj)) {
      for (var key in obj) {
        antimeridian(obj[key], offset, lastOffset);
      }
    }

    return obj;
  };


  it('should query normal items within the extent', function() {
    var rbush = new ol.structs.RBush();
    standardImport(rbush);
    var result = testExtent(rbush, [-5, -20, 5, 20]);
    expect(result.length).toBeGreaterThan(0);
  });


  it('should query items around the antimeridian', function() {
    var rbush = new ol.structs.RBush();
    standardImport(rbush, antimeridian(clone(geoms)));

    var left = testExtent(rbush, [-185, -20, -175, 20]);
    var right = testExtent(rbush, [175, -20, 185, 20]);

    expect(left).toEqual(right);
    expect(left.length).toBeGreaterThan(0);
  });


  it('should query full-world extents', function() {
    var rbush = new ol.structs.RBush();
    standardImport(rbush, antimeridian(clone(geoms)));
    testExtent(rbush, [-180, -90, 180, 90]);
  });
});
