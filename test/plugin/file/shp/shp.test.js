goog.require('plugin.file.shp');

import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('plugin.file.shp', () => {
  const {
    TYPE,
    getFlatGroupCoordinates,
    getPartCoordinatesFromGeometry,
    getShapeTypeFromGeometry
  } = goog.module.get('plugin.file.shp');

  const coordsEqual = (a, b) => JSON.stringify(a) == JSON.stringify(b);

  it('flattens geometry coordinates down to coordinate groups', () => {
    let coordinates = [0, 0];
    expect(getFlatGroupCoordinates(coordinates)).toBe(coordinates);

    coordinates = [[0, 0], [1, 1]];
    expect(getFlatGroupCoordinates(coordinates)).toBe(coordinates);

    coordinates = [[[0, 0], [1, 1]], [[2, 2], [3, 3]]];
    let result = getFlatGroupCoordinates(coordinates);
    let expected = [[0, 0], [1, 1], [2, 2], [3, 3]];
    expect(coordsEqual(result, expected)).toBe(true);

    coordinates = [
      [[[0, 0], [0, 1], [1, 1], [0, 0]]],
      [[[2, 0], [2, 1], [2, 2], [2, 0]]]
    ];
    result = getFlatGroupCoordinates(coordinates);
    expected = [[0, 0], [0, 1], [1, 1], [0, 0], [2, 0], [2, 1], [2, 2], [2, 0]];
    expect(coordsEqual(result, expected)).toBe(true);
  });

  it('gets part coordinates from a point', () => {
    const point = new Point([0, 0]);
    const partCoords = getPartCoordinatesFromGeometry(point);
    expect(coordsEqual(partCoords, [point.getCoordinates()])).toBe(true);
  });

  it('gets part coordinates from a multi-point', () => {
    const multiPoint = new MultiPoint([[0, 0], [1, 1]]);
    const partCoords = getPartCoordinatesFromGeometry(multiPoint);
    expect(coordsEqual(partCoords, multiPoint.getCoordinates())).toBe(true);
  });

  it('gets part coordinates from a line', () => {
    const line = new LineString([[0, 0], [1, 1]]);
    const partCoords = getPartCoordinatesFromGeometry(line);
    expect(coordsEqual(partCoords, [line.getCoordinates()])).toBe(true);
  });

  it('gets part coordinates from a multi-line', () => {
    const multiLine = new MultiLineString([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]);
    const partCoords = getPartCoordinatesFromGeometry(multiLine);
    expect(coordsEqual(partCoords, multiLine.getCoordinates())).toBe(true);
  });

  it('gets part coordinates from a polygon', () => {
    const polygon = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
    const partCoords = getPartCoordinatesFromGeometry(polygon);
    expect(coordsEqual(partCoords, polygon.getCoordinates())).toBe(true);
  });

  it('gets part coordinates from a multi-polygon', () => {
    const multiPolygon = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [0, 0]]],
      [[[2, 0], [2, 1], [2, 2], [2, 0]]]
    ]);
    const expected = [
      [[0, 0], [0, 1], [1, 1], [0, 0]],
      [[2, 0], [2, 1], [2, 2], [2, 0]]
    ];
    const partCoords = getPartCoordinatesFromGeometry(multiPolygon);
    expect(coordsEqual(partCoords, expected)).toBe(true);
  });

  it('does not return a shape when geometry is not defined or unsupported', () => {
    expect(getShapeTypeFromGeometry()).toBe(-1);
    expect(getShapeTypeFromGeometry(null)).toBe(-1);
  });

  it('gets the correct shape type from a point geometry', () => {
    const point = new Point([0, 0]);
    expect(getShapeTypeFromGeometry(point)).toBe(TYPE.POINT);

    point.setCoordinates([0, 0, 0]);
    expect(getShapeTypeFromGeometry(point)).toBe(TYPE.POINT);

    point.setCoordinates([0, 0, 1000]);
    expect(getShapeTypeFromGeometry(point)).toBe(TYPE.POINTZ);
  });

  it('gets the correct shape type from a multi-point geometry', () => {
    const multiPoint = new MultiPoint([[0, 0], [1, 1]]);
    expect(getShapeTypeFromGeometry(multiPoint)).toBe(TYPE.MULTIPOINT);

    multiPoint.setCoordinates([[0, 0, 0], [1, 1, 0]]);
    expect(getShapeTypeFromGeometry(multiPoint)).toBe(TYPE.MULTIPOINT);

    multiPoint.setCoordinates([[0, 0, 0], [1, 1, 1000]]);
    expect(getShapeTypeFromGeometry(multiPoint)).toBe(TYPE.MULTIPOINTZ);
  });

  it('gets the correct shape type from a line geometry', () => {
    const line = new LineString([[0, 0], [1, 1]]);
    expect(getShapeTypeFromGeometry(line)).toBe(TYPE.POLYLINE);

    line.setCoordinates([[0, 0, 0], [1, 1, 0]]);
    expect(getShapeTypeFromGeometry(line)).toBe(TYPE.POLYLINE);

    line.setCoordinates([[0, 0, 0], [1, 1, 1000]]);
    expect(getShapeTypeFromGeometry(line)).toBe(TYPE.POLYLINEZ);
  });

  it('gets the correct shape type from a multi-line geometry', () => {
    const multiLine = new MultiLineString([[[0, 0], [1, 1]], [[2, 2], [3, 3]]]);
    expect(getShapeTypeFromGeometry(multiLine)).toBe(TYPE.POLYLINE);

    multiLine.setCoordinates([[[0, 0, 0], [1, 1, 0]], [[2, 2, 0], [3, 3, 0]]]);
    expect(getShapeTypeFromGeometry(multiLine)).toBe(TYPE.POLYLINE);

    multiLine.setCoordinates([[[0, 0, 0], [1, 1, 0]], [[2, 2, 0], [3, 3, 1000]]]);
    expect(getShapeTypeFromGeometry(multiLine)).toBe(TYPE.POLYLINEZ);
  });

  it('gets the correct shape type from a polygon geometry', () => {
    const polygon = new Polygon([[[0, 0], [0, 1], [1, 1], [0, 0]]]);
    expect(getShapeTypeFromGeometry(polygon)).toBe(TYPE.POLYGON);

    polygon.setCoordinates([[[0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 0]]]);
    expect(getShapeTypeFromGeometry(polygon)).toBe(TYPE.POLYGON);

    polygon.setCoordinates([[[0, 0, 0], [0, 1, 0], [1, 1, 1000], [0, 0, 0]]]);
    expect(getShapeTypeFromGeometry(polygon)).toBe(TYPE.POLYGONZ);
  });

  it('gets the correct shape type from a multi-polygon geometry', () => {
    const multiPolygon = new MultiPolygon([
      [[[0, 0], [0, 1], [1, 1], [0, 0]]],
      [[[2, 0], [2, 1], [2, 2], [2, 0]]]
    ]);
    expect(getShapeTypeFromGeometry(multiPolygon)).toBe(TYPE.POLYGON);

    multiPolygon.setCoordinates([
      [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 0]]],
      [[[2, 0, 0], [2, 1, 0], [2, 2, 0], [2, 0, 0]]]
    ]);
    expect(getShapeTypeFromGeometry(multiPolygon)).toBe(TYPE.POLYGON);

    multiPolygon.setCoordinates([
      [[[0, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 0]]],
      [[[2, 0, 0], [2, 1, 1000], [2, 2, 0], [2, 0, 0]]]
    ]);
    expect(getShapeTypeFromGeometry(multiPolygon)).toBe(TYPE.POLYGONZ);
  });
});
