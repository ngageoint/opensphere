goog.require('os.mixin.geometry');
goog.require('os.proj');

import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import LinearRing from 'ol/src/geom/LinearRing.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('os.mixin.geometry', function() {
  const {EPSG3857, EPSG4326} = goog.module.get('os.proj');

  it('should clone the values of geometries when cloning', function() {
    var key = 'extrude';
    var val = true;

    var point = new Point([0, 0]);
    var line = new LineString([[0, 0], [1, 1]]);
    var poly = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);

    var list = [
      new GeometryCollection([point, line, poly]),
      line,
      new LinearRing(line.getCoordinates()),
      new MultiLineString([poly.getCoordinates()]),
      new MultiPoint(line.getCoordinates()),
      new MultiPolygon([poly.getCoordinates()]),
      point,
      poly];

    list.forEach(function(geom) {
      geom.set(key, val);
      var clone = geom.clone();
      expect(clone.get(key)).toBe(val);
    });
  });

  it('should have GeometryCollection do a safe clone of its sub-geometries', function() {
    var point = new Point([0, 0]);
    var line = new LineString([[0, 0], [1, 1]]);
    var poly = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
    var collection = new GeometryCollection([point, line, poly]);

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
    const point = new Point([-45, 45]);
    const line = new LineString([[-45, 45], [0, 0]]);
    const poly = new Polygon([[[-45, 45], [45, 45], [0, 0], [-45, 45]]]);

    const testGeometries = [point, line, poly];
    const expectedGeometries = testGeometries.map((g) => g.clone());

    for (let i = 0, n = testGeometries.length; i < n; i++) {
      testGeometries[i].transform(EPSG4326, EPSG3857);
      expect(testGeometries[i].getFlatCoordinates()).not.toEqual(expectedGeometries[i].getFlatCoordinates());

      // tests protection against the incorrect step of doubly-transforming the projection
      testGeometries[i].transform(EPSG4326, EPSG3857);

      // transform back to the original
      testGeometries[i].transform(EPSG3857, EPSG4326);
      expect(testGeometries[i].getFlatCoordinates()).toEqual(expectedGeometries[i].getFlatCoordinates());
    }
  });
});
