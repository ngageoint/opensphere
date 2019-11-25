goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('os.mixin.geometry');
goog.require('os.proj');


describe('os.mixin.geometry', function() {
  it('should clone the values of geometries when cloning', function() {
    var key = 'extrude';
    var val = true;

    var point = new ol.geom.Point([0, 0]);
    var line = new ol.geom.LineString([[0, 0], [1, 1]]);
    var poly = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);

    var list = [
      new ol.geom.GeometryCollection([point, line, poly]),
      line,
      new ol.geom.LinearRing(line.getCoordinates()),
      new ol.geom.MultiLineString([poly.getCoordinates()]),
      new ol.geom.MultiPoint(line.getCoordinates()),
      new ol.geom.MultiPolygon([poly.getCoordinates()]),
      point,
      poly];

    list.forEach(function(geom) {
      geom.set(key, val);
      var clone = geom.clone();
      expect(clone.get(key)).toBe(val);
    });
  });

  it('should have GeometryCollection do a safe clone of its sub-geometries', function() {
    var point = new ol.geom.Point([0, 0]);
    var line = new ol.geom.LineString([[0, 0], [1, 1]]);
    var poly = new ol.geom.Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
    var collection = new ol.geom.GeometryCollection([point, line, poly]);

    var clone = collection.clone();
    expect(clone).not.toBe(collection);
    var geoms = clone.getGeometriesArray();
    expect(geoms.length).toBe(3);

    geoms.forEach(function(geom) {
      expect(geom).not.toBe(point);
      expect(geom).not.toBe(line);
      expect(geom).not.toBe(poly);
    });
  });

  it('should not doubly transform geometries', function() {
    const point = new ol.geom.Point([-45, 45]);
    const line = new ol.geom.LineString([[-45, 45], [0, 0]]);
    const poly = new ol.geom.Polygon([[[-45, 45], [45, 45], [0, 0], [-45, 45]]]);

    const testGeometries = [point, line, poly];
    const expectedGeometries = testGeometries.map((g) => g.clone());

    for (let i = 0, n = testGeometries.length; i < n; i++) {
      testGeometries[i].transform(os.proj.EPSG4326, os.proj.EPSG3857);
      expect(testGeometries[i].getFlatCoordinates()).not.toEqual(
          expectedGeometries[i].getFlatCoordinates());

      // tests protection against the incorrect step of doubly-transforming the projection
      testGeometries[i].transform(os.proj.EPSG4326, os.proj.EPSG3857);

      // transform back to the original
      testGeometries[i].transform(os.proj.EPSG3857, os.proj.EPSG4326);
      expect(testGeometries[i].getFlatCoordinates()).toEqual(expectedGeometries[i].getFlatCoordinates());
    }
  });
});
