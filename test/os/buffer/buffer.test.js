goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('os.buffer');
goog.require('os.geo');
goog.require('os.geo.jsts');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.query');

describe('os.buffer', function() {
  const LineString = goog.module.get('ol.geom.LineString');
  const Point = goog.module.get('ol.geom.Point');
  const Polygon = goog.module.get('ol.geom.Polygon');
  const olProj = goog.module.get('ol.proj');
  const geo = goog.module.get('os.geo');
  const osJsts = goog.module.get('os.geo.jsts');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');

  var checkPercentDiff = function(input, dist, geom, opt_all) {
    dist = Math.abs(dist);
    input.toLonLat();
    geom.toLonLat();

    var inputCoords = input.getFlatCoordinates();
    var inputLayout = input.getLayout().length;
    var geomCoords = geom.getFlatCoordinates();
    var geomLayout = geom.getLayout().length;

    var pass = false;
    var min = Number.POSITIVE_INFINITY;

    for (var i = 0, n = inputCoords.length; i < n; i += inputLayout) {
      var p1 = inputCoords.slice(i, i + 2);

      for (var j = 0, m = geomCoords.length; j < m; j += geomLayout) {
        var p2 = geomCoords.slice(j, j + 2);
        var d = geo.vincentyDistance(p1, p2);
        min = Math.min(min, d);

        if (Math.abs(d - dist) / dist < 0.005) {
          pass = true;

          if (!opt_all) {
            break;
          }
        } else {
          pass = false;
        }
      }

      if (!pass) {
        break;
      }
    }

    if (!pass) {
      console.log('Min distance was ' + min + 'm, target distance was ' + dist + 'm, diff ' +
        (Math.abs(min - dist) * 100 / dist) + '%');
    }

    return pass;
  };

  it('should return null when the distance is zero', function() {
    var geom = new Point([0, 0]);
    var buffered = osJsts.buffer(geom, 0);
    expect(buffered).toBe(null);
  });

  it('should buffer points with absolute distances', function() {
    var geom = new Point([0, 0]);
    var dist = -100000;
    var buffered = osJsts.buffer(geom, dist);
    expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);
  });

  var distances = [100000, 50000, 25000, 15000, 10000, 5000, 3000, 1000, 500];

  distances.forEach(function(dist) {
    it('should buffer points into circles at easy latitudes dist=' + dist, function() {
      var geom = new Point([0, 0]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);
    });

    it('should buffer points into circles at mid latitudes dist=' + dist, function() {
      var geom = new Point([40, 40]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);
    });

    it('should buffer points into circles at high latitudes dist=' + dist, function() {
      var geom = new Point([80, 80]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);
    });

    it('should buffer points into circles at easy latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new Point([0, 0]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer points into circles at mid latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new Point([40, 40]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer points into circles at high latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new Point([80, 80]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered, true)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer lines at easy latitudes dist=' + dist, function() {
      var geom = new LineString([[-1, -1], [1, 1]]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);
    });

    it('should buffer lines at mid latitudes dist=' + dist, function() {
      var geom = new LineString([[39, 39], [41, 41]]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);
    });

    it('should buffer lines at high latitudes dist=' + dist, function() {
      var geom = new LineString([[79, 79], [81, 81]]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);
    });

    it('should buffer lines at easy latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new LineString([[-1, -1], [1, 1]]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer lines at mid latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new LineString([[39, 39], [41, 41]]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer lines at high latitudes for other projections dist=' + dist, function() {
      var originalProjection = osMap.PROJECTION;
      osMap.setProjection(olProj.get(osProj.EPSG3857));

      var geom = new LineString([[79, 79], [81, 81]]).osTransform();
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);

      osMap.setProjection(originalProjection);
    });

    it('should buffer polygons dist=' + dist, function() {
      var geom = new Polygon([[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]]);
      var buffered = osJsts.buffer(geom, dist);
      expect(checkPercentDiff(geom, dist, buffered)).toBe(true);
    });

    xit('should inner buffer polygons if distance is negative dist=' + dist, function() {
      var geom = new Polygon([[[-1, -1], [1, -1], [1, 1], [-1, 1], [-1, -1]]]);
      var buffered = osJsts.buffer(geom, -dist);
      expect(checkPercentDiff(geom, -dist, buffered)).toBe(true);
    });
  });
});
