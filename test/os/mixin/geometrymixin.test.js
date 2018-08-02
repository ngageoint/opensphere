goog.require('os.mixin.geometry');


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
});
