goog.require('ol.geom.LineString');
goog.require('ol.geom.MultiPolygon');
goog.require('ol.geom.Polygon');
goog.require('os.geo.jsts');
goog.require('os.proj');

describe('os.geo.jsts', function() {
  it('should split polygons properly', function() {
    var polygon = new ol.geom.Polygon.fromExtent([-2, -2, 2, 2]);
    var line = new ol.geom.LineString([[0, -4], [0, 4]]);

    var result = os.geo.jsts.splitPolygonByLine(polygon, line);
    expect(result instanceof ol.geom.MultiPolygon).toBe(true);
    var polys = result.getPolygons();
    expect(polys.length).toBe(2);

    expect(polys[0].getExtent()).toEqual([-2, -2, 0, 2]);
    expect(polys[1].getExtent()).toEqual([0, -2, 2, 2]);

    polys.forEach(function(poly) {
      expect(os.geo.isClosed(poly.getCoordinates()[0])).toBe(true);
    });
  });

  // This test is deactivated because JSTS does not linearly interpolate the Z
  // coordinate when splitting/polygonizing
  xit('should split polygons with a z-coord properly', function() {
    var polygon = new ol.geom.Polygon([[
      [-2, -2, 2],
      [2, -2, 4],
      [2, 2, 4],
      [-2, 2, 2],
      [-2, -2, 2]]]);

    var line = new ol.geom.LineString([[0, -4, 0], [0, 4, 0]]);

    var result = os.geo.jsts.splitPolygonByLine(polygon, line);
    expect(result instanceof ol.geom.MultiPolygon).toBe(true);
    var polys = result.getPolygons();
    expect(polys.length).toBe(2);

    expect(polys[0].getExtent()).toEqual([-2, -2, 0, 2]);
    expect(polys[1].getExtent()).toEqual([0, -2, 2, 2]);

    polys.forEach(function(poly) {
      var rings = poly.getCoordinates();
      expect(os.geo.isClosed(rings[0])).toBe(true);

      for (var i = 0, n = rings[0].length; i < n; i++) {
        var coord = rings[0][i];
        if (coord[0] === -2) {
          expect(coord[2]).toBe(2);
        } else if (coord[0] === 0) {
          expect(coord[2]).toBe(3);
        } else if (coord[0] === 2) {
          expect(coord[2]).toBe(4);
        }
      }
    });
  });

  it('should split north polar polygons properly', function() {
    proj4.defs('EPSG:3413',
        '+proj=stere +lat_0=90 +lat_ts=70 +lon_0=-45 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

    var polygon = new ol.geom.Polygon([[
      [0, 85],
      [90, 85],
      [180, 85],
      [270, 85],
      [0, 85]]]);

    var result = os.geo.jsts.splitPolarPolygon(polygon);
    expect(result instanceof ol.geom.MultiPolygon).toBe(true);
    var polys = result.getPolygons();
    expect(polys.length).toBe(2);

    expect(polys[0].getExtent()).toEqual([-180, 85, 0, 90]);
    expect(polys[1].getExtent()).toEqual([0, 85, 180, 90]);

    polys.forEach(function(poly) {
      expect(os.geo.isClosed(poly.getCoordinates()[0])).toBe(true);
    });
  });

  it('should split south polar polygons properly', function() {
    proj4.defs('EPSG:3031',
        '+proj=stere +lat_0=-90 +lat_ts=-71 +lon_0=0 +k=1 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs');

    var polygon = new ol.geom.Polygon([[
      [0, -85],
      [90, -85],
      [180, -85],
      [270, -85],
      [0, -85]]]);

    var result = os.geo.jsts.splitPolarPolygon(polygon);
    expect(result instanceof ol.geom.MultiPolygon).toBe(true);
    var polys = result.getPolygons();
    expect(polys.length).toBe(2);

    expect(polys[0].getExtent()).toEqual([-180, -90, 0, -85]);
    expect(polys[1].getExtent()).toEqual([0, -90, 180, -85]);

    polys.forEach(function(poly) {
      expect(os.geo.isClosed(poly.getCoordinates()[0])).toBe(true);
    });
  });
});
