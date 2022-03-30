goog.require('goog.array');
goog.require('os.geo');
goog.require('os.osasm.wait');
goog.require('os.query');

import Feature from 'ol/src/Feature.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import LineString from 'ol/src/geom/LineString.js';
import MultiLineString from 'ol/src/geom/MultiLineString.js';
import MultiPoint from 'ol/src/geom/MultiPoint.js';
import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import Point from 'ol/src/geom/Point.js';
import Polygon, {fromExtent} from 'ol/src/geom/Polygon.js';

describe('os.geo', function() {
  const googArray = goog.module.get('goog.array');
  const geo = goog.module.get('os.geo');

  it('should parse DMS separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('103036 501545', undefined, 'DMS');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse padded DMS separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('033036 0501545', undefined, 'DMS');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(3.51);
  });

  it('should parse DMS with no separator and required direction', function() {
    var result = geo.parseLatLon('465445000N1303901000E', undefined, 'DMS');
    expect(result.lat).toBeCloseTo(46.9125);
    expect(result.lon).toBeCloseTo(130.65);
  });

  it('should not parse DMS with no separator and no direction', function() {
    var result = geo.parseLatLon('4654450001303901000', undefined, 'DMS');
    expect(result).toBeNull();
  });

  it('should parse DDM with no separator and required direction', function() {
    var result = geo.parseLatLon('1030N5015E', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.50);
  });

  it('should not parse DMS with no separator and no direction', function() {
    var result = geo.parseLatLon('10305015', undefined, 'DDM');
    expect(result).toBeNull();
  });

  it('should parse DMS with space delimiters without direction', function() {
    var result = geo.parseLatLon('10 30 36 50 15 45');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should handle partial DMS separated by space without delimiters', function() {
    var result = geo.parseLatLon('1030 5015');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should handle partial DMS separated by space with delimiters', function() {
    var result = geo.parseLatLon('10°30\'50° 15\'');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should handle partial DMS separated by space with space delimiters', function() {
    var result = geo.parseLatLon('10 30 50 15');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse padded DMS with space delimiters without direction', function() {
    var result = geo.parseLatLon('05 06 09 050 03 9.0');
    expect(result.lon).toBeCloseTo(50.0525);
    expect(result.lat).toBeCloseTo(5.1025);
  });

  it('should parse unpadded DMS with space delimiters without direction', function() {
    var result = geo.parseLatLon('5 6 9 50 3 9.0');
    expect(result.lon).toBeCloseTo(50.0525);
    expect(result.lat).toBeCloseTo(5.1025);
  });

  it('should parse DMS with unit delimiters without direction', function() {
    var result = geo.parseLatLon('10° 30\' 36" 50° 15\' 45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS lat and lon separately with unit delimiters with direction and opt_format', function() {
    var resultLat = geo.parseLat('10° 30\' 36" S', 'DMS');
    var resultLon = geo.parseLon('50° 15\' 45" W', 'DMS');
    expect(resultLat).toBeCloseTo(-10.51);
    expect(resultLon).toBeCloseTo(-50.2625);
  });

  it('should parse DMS with unit delimiters without spaces or direction', function() {
    var result = geo.parseLatLon('10°30\'36"50°15\'45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS with unit delimiters delimited by space without direction', function() {
    var result = geo.parseLatLon('10°30\'36" 50°15\'45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS with unit delimiters delimited by comma without direction', function() {
    var result = geo.parseLatLon('10°30\'36",50°15\'45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS with unit delimiters delimited by space with direction NE', function() {
    var result = geo.parseLatLon('10°30\'36"N 50°15\'45"E');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
    var result = geo.parseLatLon('N10°30\'36" E50°15\'45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS with unit delimiters delimited by space with direction SE', function() {
    var result = geo.parseLatLon('10°30\'36"S 50°15\'45"E');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(-10.51);
    var result = geo.parseLatLon('S10°30\'36" E50°15\'45"');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(-10.51);
  });

  it('should parse DMS with unit delimiters delimited by space with direction NW', function() {
    var result = geo.parseLatLon('10°30\'36"N 50°15\'45"W');
    expect(result.lon).toBeCloseTo(-50.2625);
    expect(result.lat).toBeCloseTo(10.51);
    var result = geo.parseLatLon('N10°30\'36" W50°15\'45"');
    expect(result.lon).toBeCloseTo(-50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse DMS with unit delimiters delimited by space with direction SW', function() {
    var result = geo.parseLatLon('10°30\'36"S 50°15\'45"W');
    expect(result.lon).toBeCloseTo(-50.2625);
    expect(result.lat).toBeCloseTo(-10.51);
    var result = geo.parseLatLon('S10°30\'36" W50°15\'45"');
    expect(result.lon).toBeCloseTo(-50.2625);
    expect(result.lat).toBeCloseTo(-10.51);
  });

  it('should parse unpadded DMS separated by space without delimiters', function() {
    var result = geo.parseLatLon('334600N 25500E');
    expect(result.lon).toBeCloseTo(2.9166666666666665);
    expect(result.lat).toBeCloseTo(33.766666666666666);
  });

  it('should parse D.MS separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('10.3036 50.1545', undefined, 'DMS');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse padded D.MS separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('03.3036 050.1545', undefined, 'DMS');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(3.51);
  });

  it('should handle partial D.MS separated by space without delimiters', function() {
    var result = geo.parseLatLon('10.3036 50.1545', undefined, 'DMS');
    expect(result.lon).toBeCloseTo(50.2625);
    expect(result.lat).toBeCloseTo(10.51);
  });

  it('should parse D.MM separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('10.30 50.15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse padded D.MM separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('03.30 050.15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(3.5);
  });

  it('should handle partial D.MM separated by space without delimiters', function() {
    var result = geo.parseLatLon('10.30 50.15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('1030 5015', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse padded DDM separated by space without delimiters or direction', function() {
    var result = geo.parseLatLon('0330 05015', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(3.5);
  });

  it('should parse DDM with space delimiters without direction', function() {
    var result = geo.parseLatLon('10 30 50 15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should handle partial DDM separated by space without delimiters', function() {
    var result = geo.parseLatLon('1030 5015', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should handle partial DDM separated by space with delimiters', function() {
    var result = geo.parseLatLon('10°30\'50° 15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should handle partial DDM separated by space with space delimiters', function() {
    var result = geo.parseLatLon('10 30 50 15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse padded DDM with space delimiters without direction', function() {
    var result = geo.parseLatLon('05 06.15 050 03.15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.0525);
    expect(result.lat).toBeCloseTo(5.1025);
  });

  it('should parse unpadded DDM with space delimiters without direction', function() {
    var result = geo.parseLatLon('5 6.15 50 3.15', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.0525);
    expect(result.lat).toBeCloseTo(5.1025);
  });

  it('should parse DDM with unit delimiters without direction', function() {
    var result = geo.parseLatLon('10° 30\' 50° 15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters without spaces or direction', function() {
    var result = geo.parseLatLon('10°30\'50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters delimited by space without direction', function() {
    var result = geo.parseLatLon('10°30\' 50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters delimited by comma without direction', function() {
    var result = geo.parseLatLon('10°30\',50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters delimited by space with direction NE', function() {
    var result = geo.parseLatLon('10°30\'N 50°15\'E', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
    var result = geo.parseLatLon('N10°30\' E50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters delimited by space with direction SE', function() {
    var result = geo.parseLatLon('10°30\'S 50°15\'E', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(-10.5);
    var result = geo.parseLatLon('S10°30\' E50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(50.25);
    expect(result.lat).toBeCloseTo(-10.5);
  });

  it('should parse DDM with unit delimiters delimited by space with direction NW', function() {
    var result = geo.parseLatLon('10°30\'N 50°15\'W', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(-50.25);
    expect(result.lat).toBeCloseTo(10.5);
    var result = geo.parseLatLon('N10°30\' W50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(-50.25);
    expect(result.lat).toBeCloseTo(10.5);
  });

  it('should parse DDM with unit delimiters delimited by space with direction SW', function() {
    var result = geo.parseLatLon('10°30\'S 50°15\'W', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(-50.25);
    expect(result.lat).toBeCloseTo(-10.5);
    var result = geo.parseLatLon('S10°30\' W50°15\'', undefined, 'DDM');
    expect(result.lon).toBeCloseTo(-50.25);
    expect(result.lat).toBeCloseTo(-10.5);
  });

  it('should not assume lon first if coord is three-digit padded', function() {
    var result = geo.parseLatLon('001 9 36 01 6 36');
    expect(result.lon).toBeCloseTo(1.11);
    expect(result.lat).toBeCloseTo(1.16);
  });

  it('should assume lon first if coord is three-digit padded with decimal', function() {
    var result = geo.parseLatLon('001.16 01.11', undefined, 'DD');
    expect(result.lon).toBeCloseTo(1.16);
    expect(result.lat).toBeCloseTo(1.11);
  });

  // mixed no longer supported
  it('should not handle decimal/DMS delimited formats', function() {
    var result = geo.parseLatLon('25° -105°30\'00"');
    expect(result).toBeNull();
  });

  it('should handle DMS delimited/decimal formats', function() {
    var result = geo.parseLatLon('-105°30\'00" 25°');
    expect(result).toBeNull();
  });

  it('should handle decimal/DMS formats', function() {
    var result = geo.parseLatLon('25.5 -1053000');
    expect(result).toBeNull();
  });

  it('should handle DMS/decimal formats', function() {
    var result = geo.parseLatLon('-1053000 25.5');
    expect(result).toBeNull();
  });

  it('should honor direction above other assumptions', function() {
    var result = geo.parseLatLon('001.16N 01.11E', undefined, 'DD');
    expect(result.lon).toBeCloseTo(1.11);
    expect(result.lat).toBeCloseTo(1.16);
    var result = geo.parseLatLon('N001.16 E01.11', undefined, 'DD');
    expect(result.lon).toBeCloseTo(1.11);
    expect(result.lat).toBeCloseTo(1.16);
  });

  it('should allow white space between coord and direction for decimal', function() {
    var result = geo.parseLatLon('1.5  N 5.1   E');
    expect(result.lon).toBeCloseTo(5.1);
    expect(result.lat).toBeCloseTo(1.5);
    var result = geo.parseLatLon('N  1.5 E  5.1   ');
    expect(result.lon).toBeCloseTo(5.1);
    expect(result.lat).toBeCloseTo(1.5);
  });

  it('should allow white space between coord and direction for DMS', function() {
    var result = geo.parseLatLon('10 0 0  N 120 0 0   E');
    expect(result.lon).toBeCloseTo(120);
    expect(result.lat).toBeCloseTo(10);
  });

  it('should parse milliarcseconds with decimal points included', function() {
    var result = geo.parseLatLon('103036.750 N  501545.250 E');
    expect(result.lon).toBeCloseTo('50.262569444');
    expect(result.lat).toBeCloseTo('10.510208333');
  });

  it('should parse milliarcseconds with decimal points missing', function() {
    var result = geo.parseLatLon('103036750 N  501545250 E');
    expect(result.lon).toBeCloseTo('50.262569444');
    expect(result.lat).toBeCloseTo('10.510208333');
  });

  it('should assume lon first when preferred', function() {
    var result = geo.parseLatLon('1.11 1.16', geo.PREFER_LON_FIRST);
    expect(result.lon).toBeCloseTo(1.11);
    expect(result.lat).toBeCloseTo(1.16);
  });

  it('should assume lon first when preferred all coords are three-digit padded', function() {
    var result = geo.parseLatLon('001.11 01.16', geo.PREFER_LON_FIRST);
    expect(result.lon).toBeCloseTo(1.11);
    expect(result.lat).toBeCloseTo(1.16);
  });

  it('should not flip lon/lat values when explicitly told which value is first', function() {
    var result = geo.parseLatLon('125 75', geo.PREFER_LON_FIRST);
    expect(result.lon).toBeCloseTo(125);
    expect(result.lat).toBeCloseTo(75);
  });

  it('should not flip lat/lon values when explicitly told which value is first', function() {
    var result = geo.parseLatLon('75 125', geo.PREFER_LAT_FIRST);
    expect(result.lon).toBeCloseTo(125);
    expect(result.lat).toBeCloseTo(75);
  });

  it('should not flip lat/lon values when a direction is provided N/E', function() {
    var result = geo.parseLatLon('75 N 125 E');
    expect(result.lon).toBeCloseTo(125);
    expect(result.lat).toBeCloseTo(75);
  });

  it('should not flip lat/lon values when a direction is provided N/W', function() {
    var result = geo.parseLatLon('75 N 125 W');
    expect(result.lon).toBeCloseTo(-125);
    expect(result.lat).toBeCloseTo(75);
  });

  it('should not flip lat/lon values when a direction is provided S/E', function() {
    var result = geo.parseLatLon('25 E 175 S');
    expect(result.lon).toBeCloseTo(25);
    expect(result.lat).toBeCloseTo(-175);
  });

  it('should not flip lat/lon values when a direction is provided S/W', function() {
    var result = geo.parseLatLon('25 W 175 S');
    expect(result.lon).toBeCloseTo(-25);
    expect(result.lat).toBeCloseTo(-175);
  });

  it('should not parse items with too many digits as DD', () => {
    expect(geo.parseLon('-0750015.1')).toBeCloseTo(geo.parseLon('0750015.1 W'));
    expect(geo.parseLat('-750015.1')).toBeCloseTo(geo.parseLat('750015.1 S'));
    expect(geo.parseLon('-0000015.1')).toBeCloseTo(geo.parseLon('0000015.1 W'));
    expect(geo.parseLat('-000015.1')).toBeCloseTo(geo.parseLat('000015.1 S'));
  });

  it('should not parse BE Numbers as coordinates', function() {
    var result = geo.parseLatLon('0440-01934');
    expect(result).toBeNull();
    result = geo.parseLatLon('0431CA1268');
    expect(result).toBeNull();
  });

  it('should validate extents', function() {
    var result = geo.isValidExtent([0, 0, 0, 0]);
    expect(result).toBe(false);
    result = geo.isValidExtent([-9000, 1, 2, 3]);
    expect(result).toBe(false);
    result = geo.isValidExtent([-900, 1, -880, 3]);
    expect(result).toBe(true);
    result = geo.isValidExtent([-180, -90, 181, 90]);
    expect(result).toBe(false);
    result = geo.isValidExtent([-180, -90, 180, 90]);
    expect(result).toBe(true);
  });

  it('extents should cross the date line', function() {
    var target = [-184.9209430003858, 61.585644431614085, -168.72498457795734, 69.29410059216232];
    var result = geo.crossesDateLine(target);
    expect(result).toBe(true);

    target = [-201.0248700173605, 35.569012786371935, -138.41275013123763, 65.54289996589880];
    result = geo.crossesDateLine(target);
    expect(result).toBe(true);

    target = [-211.54903484928332, -13.188510358991834, -138.94561923665142, 13.721379464405658];
    result = geo.crossesDateLine(target);
    expect(result).toBe(true);

    target = [156.66351699166069, 35.83544733907885, 226.73580435357695, 63.411423544243604];
    result = geo.crossesDateLine(target);
    expect(result).toBe(true);

    target = [169.31915824523873, 7.060515646733009, 194.23078892333442, 21.18154694019902];
    result = geo.crossesDateLine(target);
    expect(result).toBe(true);
  });

  it('detects polygonal geometries', function() {
    // polygonal geometry types
    expect(geo.isGeometryPolygonal(new Polygon([]))).toBe(true);
    expect(geo.isGeometryPolygonal(new MultiPolygon([]))).toBe(true);

    // missing geometry
    expect(geo.isGeometryPolygonal(null)).toBe(false);
    expect(geo.isGeometryPolygonal(undefined)).toBe(false);

    // different geometry types
    expect(geo.isGeometryPolygonal(new Point([]))).toBe(false);
    expect(geo.isGeometryPolygonal(new LineString([]))).toBe(false);

    // handles collections when specified
    var collection = new GeometryCollection();
    expect(geo.isGeometryPolygonal(collection)).toBe(false);

    var mixedArray = [
      new Point([]),
      new LineString([]),
      new Polygon([])
    ];
    collection.setGeometriesArray(mixedArray);
    expect(geo.isGeometryPolygonal(collection, true)).toBe(true);

    // nested collections are also handled
    collection.setGeometriesArray([new GeometryCollection(mixedArray)]);
    expect(geo.isGeometryPolygonal(collection, true)).toBe(true);
  });

  it('ol.geom.LineString should not cross the date line', function() {
    var coordinates = [[0, 0], [175, 0], [180, 0], [175, 0]];
    var geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(false);

    coordinates = [[0, 0], [-175, 0], [-180, 0], [-175, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(false);

    coordinates = [[190, 0], [185, 0], [180, 0], [185, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(false);
  });

  it('ol.geom.LineString should cross the date line', function() {
    var coordinates = [[175, 0], [-175, 0]];
    var geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(true);

    coordinates = [[-175, 0], [175, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(true);

    coordinates = [[175, 0], [185, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(true);

    coordinates = [[185, 0], [175, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(true);

    coordinates = [[185, 0], [180, 0], [175, 0]];
    geometry = new LineString(coordinates);
    expect(geo.crossesDateLine(geometry)).toBe(true);
  });

  it('ol.geom.Polygon should cross the date line', function() {
    var extent = [-184.9209430003858, 61.585644431614085, -168.72498457795734, 69.29410059216232];
    var geometry = fromExtent(extent);
    var result = geo.crossesDateLine(geometry);
    expect(result).toBe(true);

    extent = [156.66351699166069, 35.83544733907885, 226.73580435357695, 63.411423544243604];
    geometry = fromExtent(extent);
    result = geo.crossesDateLine(geometry);
    expect(result).toBe(true);
  });

  it('ol.Feature should cross the date line', function() {
    var extent = [-184.9209430003858, 61.585644431614085, -168.72498457795734, 69.29410059216232];
    var geometry = fromExtent(extent);
    var feature = new Feature({
      geometry: geometry,
      name: 'Simple Feature'
    });
    var result = geo.crossesDateLine(feature);
    expect(result).toBe(true);

    extent = [156.66351699166069, 35.83544733907885, 226.73580435357695, 63.411423544243604];
    geometry = fromExtent(extent);
    var feature = new Feature({
      geometry: geometry,
      name: 'Simple Feature'
    });
    var result = geo.crossesDateLine(feature);
    expect(result).toBe(true);
  });

  it('extents should not cross the date line', function() {
    var target = [-204.65732788733708, 0.24859222776089496, -283.4335938496441, 47.10822716068972];
    var result = geo.crossesDateLine(target);
    expect(result).toBe(false);

    target = [-107.70605382512586, 26.90931309719535, -75.70482874914197, 44.17960726927144];
    result = geo.crossesDateLine(target);
    expect(result).toBe(false);


    target = [206.35356107149863, 43.29561481487221, 229.26693260429255, 59.814557082700375];
    result = geo.crossesDateLine(target);
    expect(result).toBe(false);

    target = [-210.88294846751603, 58.6156015955193, -199.42626270111907, 67.94081094026102];
    result = geo.crossesDateLine(target);
    expect(result).toBe(false);
  });

  it('ol.geom.SimpleGeometry should not cross the date line', function() {
    var extent = [-204.65732788733708, 0.24859222776089496, -283.4335938496441, 47.10822716068972];
    var geometry = fromExtent(extent);
    var result = geo.crossesDateLine(geometry);
    expect(result).toBe(false);

    extent = [206.35356107149863, 43.29561481487221, 229.26693260429255, 59.814557082700375];
    geometry = fromExtent(extent);
    result = geo.crossesDateLine(geometry);
    expect(result).toBe(false);
  });

  it('ol.Feature should not cross the date line', function() {
    var extent = [-204.65732788733708, 0.24859222776089496, -283.4335938496441, 47.10822716068972];
    var geometry = fromExtent(extent);
    var feature = new Feature({
      geometry: geometry,
      name: 'Simple Feature'
    });
    var result = geo.crossesDateLine(feature);
    expect(result).toBe(false);

    extent = [206.35356107149863, 43.29561481487221, 229.26693260429255, 59.814557082700375];
    geometry = fromExtent(extent);
    feature = new Feature({
      geometry: geometry,
      name: 'Simple Feature'
    });
    result = geo.crossesDateLine(feature);
    expect(result).toBe(false);
  });

  it('should normalize polygons that do not cross the date line', function() {
    var extent = [-204.65732788733708, 0.24859222776089496, -283.4335938496441, 47.10822716068972];
    var geometry = fromExtent(extent);
    var result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [-107.70605382512586, 26.90931309719535, -75.70482874914197, 44.17960726927144];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [206.35356107149863, 43.29561481487221, 229.26693260429255, 59.814557082700375];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [-210.88294846751603, 58.6156015955193, -199.42626270111907, 67.94081094026102];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);
  });

  it('should normalize polygons that do cross the date line', function() {
    var extent = [-184.9209430003858, 61.585644431614085, -168.72498457795734, 69.29410059216232];
    var geometry = fromExtent(extent);
    var result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [-211.54903484928332, -13.188510358991834, -138.94561923665142, 13.721379464405658];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [156.66351699166069, 35.83544733907885, 226.73580435357695, 63.411423544243604];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);

    extent = [169.31915824523873, 7.060515646733009, 194.23078892333442, 21.18154694019902];
    geometry = fromExtent(extent);
    result = geo.normalizeGeometryCoordinates(geometry);
    expect(result).toBe(true);
  });

  it('should normalize line strings that do not cross the date line', function() {
    var coords = [[-210.882, 27.47], [-203.882, 27.17], [-196.882, 29.37]];
    var lineString = new LineString(coords);
    var result = geo.normalizeGeometryCoordinates(lineString);
    expect(result).toBe(true);
    let coordinates = lineString.getCoordinates();
    // verify the coorinate normalization
    coordinates = lineString.getCoordinates();
    expect(coordinates[0][0]).toBeCloseTo(149.118);
    expect(coordinates[1][0]).toBeCloseTo(156.118);
    expect(coordinates[2][0]).toBeCloseTo(163.118);
  });

  it('should normalize line strings that do cross the date line', function() {
    var coords = [[158.118, 27.47], [172.118, 27.17], [-163.882, 29.37]];
    var lineString = new LineString(coords);
    var result = geo.normalizeGeometryCoordinates(lineString);
    expect(result).toBe(true);
    // verify the coorinate normalization
    const coordinates = lineString.getCoordinates();
    expect(coordinates[0][0]).toBe(158.118);
    expect(coordinates[1][0]).toBe(172.118);
    expect(coordinates[2][0]).toBe(196.118);
  });

  it('should normalize multipoint geometries', function() {
    var coords = [[-210.882, 27.47], [-203.882, 27.17], [-196.882, 29.37]];
    var multiPoint = new MultiPoint(coords);
    var result = geo.normalizeGeometryCoordinates(multiPoint);
    expect(result).toBe(true);
    let coordinates = multiPoint.getCoordinates();
    // verify the coorinate normalization
    coordinates = multiPoint.getCoordinates();
    expect(coordinates[0][0]).toBeCloseTo(149.118);
    expect(coordinates[1][0]).toBeCloseTo(156.118);
    expect(coordinates[2][0]).toBeCloseTo(163.118);
  });

  it('should normalize multipolygon geometries', function() {
    var multiPolygon = new MultiPolygon([]);
    multiPolygon.appendPolygon(fromExtent(
        [-204.65732788733708, 0.24859222776089496, -283.4335938496441, 47.10822716068972]));
    multiPolygon.appendPolygon(fromExtent(
        [-210.88294846751603, 58.6156015955193, -199.42626270111907, 67.94081094026102]));
    var result = geo.normalizeGeometryCoordinates(multiPolygon);
    expect(result).toBe(true);
    // spot check coordinate normalization
    const coordinates = multiPolygon.getCoordinates();
    expect(coordinates[0][0][0][0]).toBeCloseTo(155.3426721126629);
    expect(coordinates[1][0][2][0]).toBeCloseTo(160.57373729888093);
  });

  it('should normalize multipolygon geometries that cross the date line', function() {
    var multiPolygon = new MultiPolygon([]);
    multiPolygon.appendPolygon(fromExtent(
        [-211.54903484928332, -13.188510358991834, -138.94561923665142, 13.721379464405658]));
    multiPolygon.appendPolygon(fromExtent(
        [-210.88294846751603, 58.6156015955193, -199.42626270111907, 67.94081094026102]));
    var result = geo.normalizeGeometryCoordinates(multiPolygon);
    expect(result).toBe(true);
    // spot check coordinate normalization
    const coordinates = multiPolygon.getCoordinates();
    expect(coordinates[0][0][0][0]).toBe(148.45096515071668);
    expect(coordinates[1][0][2][0]).toBe(160.57373729888093);
  });

  it('should check coordinate arrays for altitude', function() {
    var coords = [];
    coords.push([12.125, 7.225]);
    coords.push([12.125, 7.225, 0]);
    coords.push([12.225, 7.425, 2500.47]);
    coords.push([12.325, 7.625, 0]);
    var result = geo.hasAltitude(coords);
    expect(result).toBe(true);
  });

  it('should average altitude properly', function() {
    var coords = [];
    coords.push([12.125, 7.225, 2500]);
    coords.push([12.125, 7.225, 2500]);
    coords.push([12.225, 7.425, 2500]);
    coords.push([12.325, 7.625, 2500]);
    var result = geo.getAverageAltitude(coords);
    expect(result).toBe(2500);
  });

  it('should average altitude properly with some coordinates missing altitude information', function() {
    var coords = [];
    coords.push([12.125, 7.225]);
    coords.push([12.125, 7.225, 0]);
    coords.push([12.225, 7.425, 0]);
    coords.push([12.325, 7.625]);
    var result = geo.getAverageAltitude(coords);
    expect(result).toBe(0);
  });

  it('ol.geom.Point should have altitude', function() {
    var point = new Point([12.123, 17.56465, 1500]);
    expect(geo.hasAltitudeGeometry(point)).toBe(true);
  });

  it('ol.geom.Point should not have altitude', function() {
    var point = new Point([12.123, 17.56465]);
    expect(geo.hasAltitudeGeometry(point)).toBe(false);
    point = new Point([]);
    expect(geo.hasAltitudeGeometry(point)).toBe(false);
  });

  it('ol.geom.LineString should have altitude', function() {
    var coords = [[-201.882, 27.47, 1500], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    var lineString = new LineString(coords);
    expect(geo.hasAltitudeGeometry(lineString)).toBe(true);
    // Edge case test, by defualt this will return true
    coords = [[-201.882, 27.47, 0], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    lineString = new LineString(coords);
    expect(geo.hasAltitudeGeometry(lineString)).toBe(true);
    // If the optional quick paramter is true, this should be false as only the 1st coord is checked.
    expect(geo.hasAltitudeGeometry(lineString, true)).toBe(false);
    // likewise, this is also true if the quick flag is set
    coords = [[-201.882, 27.47, 1550], [-187.882, 27.17, 0], [-163.882, 29.37, 0]];
    lineString = new LineString(coords);
    expect(geo.hasAltitudeGeometry(lineString, true)).toBe(true);
  });

  it('ol.geom.LineString should not have altitude', function() {
    var coords = [[-201.882, 27.47], [-187.882, 27.17], [-163.882, 29.37]];
    var lineString = new LineString(coords);
    expect(geo.hasAltitudeGeometry(lineString)).toBe(false);
  });

  it('ol.geom.MultiPoint should have altitude', function() {
    var coords = [[-210.882, 27.47, 2500], [-203.882, 27.17, 2500], [-196.882, 29.37, 2500]];
    var multiPoint = new MultiPoint(coords);
    expect(geo.hasAltitudeGeometry(multiPoint)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiPoint, true)).toBe(true);
    // Edge case test for quick altitude detection.
    coords = [[-210.882, 27.47, 0], [-203.882, 27.17, 2500], [-196.882, 29.37, 2500]];
    multiPoint = new MultiPoint(coords);
    expect(geo.hasAltitudeGeometry(multiPoint)).toBe(true);
    // If the optional quick paramter is true, this should be false as only the 1st coord is checked.
    expect(geo.hasAltitudeGeometry(multiPoint, true)).toBe(false);
  });

  it('ol.geom.MultiPoint should not have altitude', function() {
    var coords = [[-210.882, 27.47], [-203.882, 27.17], [-196.882, 29.37]];
    var multiPoint = new MultiPoint(coords);
    expect(geo.hasAltitudeGeometry(multiPoint)).toBe(false);
  });

  it('ol.geom.MultiLineString should have altitude', function() {
    var coords1 = [[-201.882, 27.47, 1550], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    var coords2 = [[-201.882, 27.47, 1550], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    var multiLineString = new MultiLineString([coords1, coords2]);
    expect(geo.hasAltitudeGeometry(multiLineString)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiLineString, true)).toBe(true);

    coords1 = [[-201.882, 27.47, 0], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    coords2 = [[-201.882, 27.47, 1550], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    multiLineString = new MultiLineString([coords1, coords2]);
    expect(geo.hasAltitudeGeometry(multiLineString)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiLineString, true)).toBe(false);

    coords1 = [[-201.882, 27.47, 0], [-187.882, 27.17, 0], [-163.882, 29.37, 0]];
    coords2 = [[-201.882, 27.47, 0], [-187.882, 27.17, 0], [-163.882, 29.37, 1500]];
    multiLineString = new MultiLineString([coords1, coords2]);
    expect(geo.hasAltitudeGeometry(multiLineString)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiLineString, true)).toBe(false);
  });

  it('ol.geom.MultiLineString should not have altitude', function() {
    var coords1 = [[-201.882, 27.47], [-187.882, 27.17], [-163.882, 29.37]];
    var coords2 = [[-201.882, 27.47], [-187.882, 27.17], [-163.882, 29.37]];
    var multiLineString = new MultiLineString([coords1, coords2]);
    expect(geo.hasAltitudeGeometry(multiLineString)).toBe(false);
    expect(geo.hasAltitudeGeometry(multiLineString, true)).toBe(false);
  });

  it('ol.geom.Polygon should have altitude', function() {
    var coords1 = [[1, 23, 0], [1, 23.5, 12500], [2, 23.5, 12500], [2, 23, 12500], [1, 23, 12500]];
    var polygon = new Polygon([coords1]);
    expect(geo.hasAltitudeGeometry(polygon)).toBe(true);
    expect(geo.hasAltitudeGeometry(polygon, true)).toBe(false);

    coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 0]];
    const coords2 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 12500]];
    polygon = new Polygon([coords1, coords2]);

    expect(geo.hasAltitudeGeometry(polygon)).toBe(true);
    expect(geo.hasAltitudeGeometry(polygon, true)).toBe(false);
  });

  it('ol.geom.Polygon should not have altitude', function() {
    var coords1 = [[1, 23], [1, 23.5], [2, 23.5], [2, 23], [1, 23]];
    var polygon = new Polygon([coords1]);
    expect(geo.hasAltitudeGeometry(polygon)).toBe(false);
    expect(geo.hasAltitudeGeometry(polygon, true)).toBe(false);
  });


  it('ol.geom.MultiPolygon should have altitude', function() {
    var coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 12500], [2, 23, 12500], [1, 23, 0]];
    var coords2 = [[1, 23, 2500], [1, 23.6, 0], [2, 23.3, 0], [2, 23.2, 0], [1, 23, 2500]];
    var multiPolygon = new MultiPolygon([[coords1], [coords2]]);

    expect(geo.hasAltitudeGeometry(multiPolygon)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiPolygon, true)).toBe(false);

    coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 0]];
    coords2 = [[1, 23, 0], [1, 23.6, 0], [2, 23.3, 0], [2, 23.2, 0], [1, 23, 2500]];
    multiPolygon = new MultiPolygon([[coords1], [coords2]]);

    expect(geo.hasAltitudeGeometry(multiPolygon)).toBe(true);
    expect(geo.hasAltitudeGeometry(multiPolygon, true)).toBe(false);
  });

  it('ol.geom.MultiPolygon should not have altitude', function() {
    var coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 0]];
    var coords2 = [[1, 23, 0], [1, 23.6, 0], [2, 23.3, 0], [2, 23.2, 0], [1, 23, 0]];
    var multiPolygon = new MultiPolygon([[coords1], [coords2]]);

    expect(geo.hasAltitudeGeometry(multiPolygon)).toBe(false);
    expect(geo.hasAltitudeGeometry(multiPolygon, true)).toBe(false);
  });

  it('ol.geom.GeometryCollection should have altitude', function() {
    var coords = [[-201.882, 27.47, 1500], [-187.882, 27.17, 1500], [-163.882, 29.37, 1500]];
    var lineString = new LineString(coords);
    var coords1 = [[1, 23, 0], [1, 23.5, 12500], [2, 23.5, 12500], [2, 23, 12500], [1, 23, 12500]];
    var polygon = new Polygon([coords1]);
    var geometryCollection = new GeometryCollection([lineString, polygon]);

    expect(geo.hasAltitudeGeometry(geometryCollection)).toBe(true);
    expect(geo.hasAltitudeGeometry(geometryCollection, true)).toBe(true);

    coords = [[-201.882, 27.47, 0], [-187.882, 27.17, 0], [-163.882, 29.37, 0]];
    lineString = new LineString(coords);
    coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 12500]];
    polygon = new Polygon([coords1]);
    geometryCollection = new GeometryCollection([lineString, polygon]);
    expect(geo.hasAltitudeGeometry(geometryCollection)).toBe(true);
    expect(geo.hasAltitudeGeometry(geometryCollection, true)).toBe(false);
  });

  it('ol.geom.GeometryCollection should not have altitude', function() {
    var coords = [[-201.882, 27.47, 0], [-187.882, 27.17, 0], [-163.882, 29.37, 0]];
    var lineString = new LineString(coords);
    var coords1 = [[1, 23, 0], [1, 23.5, 0], [2, 23.5, 0], [2, 23, 0], [1, 23, 0]];
    var polygon = new Polygon([coords1]);
    var geometryCollection = new GeometryCollection([lineString, polygon]);

    expect(geo.hasAltitudeGeometry(geometryCollection)).toBe(false);
    expect(geo.hasAltitudeGeometry(geometryCollection, true)).toBe(false);
  });

  it('should not blow up when normalizing an empty coordinate array', function() {
    var coords = [[5, 6], [7, 8], []];
    geo.normalizeCoordinates(coords);

    expect(coords[0]).toEqual([5, 6]);
    expect(coords[1]).toEqual([7, 8]);
  });

  it('should flatten geometry collections containing a single geometry', function() {
    var point = new Point([0, 0]);
    var line = new LineString([[0, 0], [1, 1]]);

    // null input = null output
    expect(geo.flattenGeometry(null)).toBeNull();

    // non-collection returns the same geometry
    expect(geo.flattenGeometry(point)).toBe(point);
    expect(geo.flattenGeometry(line)).toBe(line);

    // collection with a single geometry returns the single geometry
    var gc = new GeometryCollection([point]);
    expect(geo.flattenGeometry(gc)).toBe(point);

    gc = new GeometryCollection([line]);
    expect(geo.flattenGeometry(gc)).toBe(line);

    // collection with multiple geometries returns the collection
    gc = new GeometryCollection([point, line]);
    expect(geo.flattenGeometry(gc)).toBe(gc);

    // nested collection with a single geometry returns the single geometry
    gc = new GeometryCollection([new GeometryCollection([point])]);
    expect(geo.flattenGeometry(gc)).toBe(point);

    gc = new GeometryCollection([new GeometryCollection([line])]);
    expect(geo.flattenGeometry(gc)).toBe(line);
  });

  it('should only split lines that cross the date line', function() {
    var geometry = new LineString([[0, 0], [10, 10]]);

    var result = geo.splitOnDateLine(geometry);
    expect(result).toBe(geometry);

    geometry = new LineString([[175, 0], [185, 0]]);

    result = geo.splitOnDateLine(geometry);
    expect(result).toBeDefined();
    expect(result).not.toBe(geometry);
  });

  it('should split lines across the date line', function() {
    var coordinates = [[175, 0], [-175, 0]];
    var geometry = new LineString(coordinates);

    // adjusts the last coordinate to cross correctly in 2D, doesn't duplicate the last coordinate
    var result = geo.splitOnDateLine(geometry);
    expect(result instanceof LineString).toBe(true);
    expect(googArray.equals(result.getFlatCoordinates(), [175, 0, 185, 0])).toBe(true);

    // splits with repeated normalized coordinate to prevent gaps
    coordinates = [[170, 0], [175, 0], [-175, 0], [-170, 0]];
    geometry = new LineString(coordinates);

    result = geo.splitOnDateLine(geometry);
    expect(result instanceof MultiLineString).toBe(true);
    expect(googArray.equals(
        result.getFlatCoordinates(),
        [170, 0, 175, 0, 185, 0, -175, 0, -170, 0])).toBe(true);
    expect(result.ends_[0]).toBe(6);

    // splits correctly when coordinates at +/- 180 are present
    coordinates = [[170, 0], [175, 0], [180, 0], [-175, 0], [-170, 0]];
    geometry = new LineString(coordinates);

    result = geo.splitOnDateLine(geometry);
    expect(result instanceof MultiLineString).toBe(true);
    expect(googArray.equals(
        result.getFlatCoordinates(),
        [170, 0, 175, 0, 180, 0, 185, 0, -175, 0, -170, 0])).toBe(true);
    expect(result.ends_[0]).toBe(8);
  });

  it('should merge lines that have been split across the date line', function() {
    var coordinates = [[170, 0], [175, 0], [-175, 0], [-170, 0]];
    var geometry = new LineString(coordinates);
    var split = geo.splitOnDateLine(geometry);
    var merged = geo.mergeLineGeometry(split);

    // coordinates are the same as the original
    expect(merged instanceof LineString).toBe(true);
    expect(googArray.equals(geometry.getFlatCoordinates(), merged.getFlatCoordinates())).toBe(true);

    // merges correctly when coordinates at +/- 180 are present
    coordinates = [[170, 0], [175, 0], [180, 0], [-175, 0], [-170, 0]];
    geometry = new LineString(coordinates);
    split = geo.splitOnDateLine(geometry);
    merged = geo.mergeLineGeometry(split);

    expect(merged instanceof LineString).toBe(true);
    expect(googArray.equals(geometry.getFlatCoordinates(), merged.getFlatCoordinates())).toBe(true);
  });

  it('should normalise longitudes greater than 180.0', function() {
    expect(geo.normalizeLongitude(190.0)).toBe(-170.0);
  });

  it('should normalise longitudes less than -180.0', function() {
    expect(geo.normalizeLongitude(-190.0)).toBe(170.0);
  });

  it('should normalise longitudes less than -540.0', function() {
    expect(geo.normalizeLongitude(-550.0)).toBe(170.0);
  });

  it('should normalise longitudes less than -720.0', function() {
    expect(geo.normalizeLongitude(-730.0)).toBe(-10.0);
  });

  it('should normalise longitudes greater than 720.0', function() {
    expect(geo.normalizeLongitude(730.0)).toBe(10.0);
  });

  it('should not modify normalise longitudes less than 180.0', function() {
    expect(geo.normalizeLongitude(170.0)).toBe(170.0);
  });

  it('should not modify normalise longitudes greater than -180.0', function() {
    expect(geo.normalizeLongitude(-170.0)).toBe(-170.0);
  });

  it('should convert lat to DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(10.51, false, false)).toEqual('1030.60N');
  });

  it('should convert lat to padded DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(5.01, false, false)).toEqual('0500.60N');
  });

  it('should convert lat to DDM only displaying 2 decimal places (rounding up)', function() {
    expect(geo.toDegreesDecimalMinutes(23.456789, false, false)).toEqual('2327.41N');
  });

  it('should convert lat to DDM only displaying 2 decimal places (rounding down)', function() {
    expect(geo.toDegreesDecimalMinutes(54.1234, false, false)).toEqual('5407.40N');
  });

  it('should convert lat to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(54.1234, false, true)).toEqual('54° 07.40\' N');
  });

  it('should convert lat to DDM with symbols (default arg)', function() {
    expect(geo.toDegreesDecimalMinutes(54.1234, false)).toEqual('54° 07.40\' N');
  });

  it('should convert negative lat to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(-37.579, false, false)).toEqual('3734.74S');
  });

  it('should convert negative lat to padded DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(-2.01, false, false)).toEqual('0200.60S');
  });

  it('should convert negative lat to DDM only displaying 2 decimal places (rounding up)', function() {
    expect(geo.toDegreesDecimalMinutes(-68.987654, false, false)).toEqual('6859.26S');
  });

  it('should convert negative lat to DDM only displaying 2 decimal places (rounding down)', function() {
    expect(geo.toDegreesDecimalMinutes(-31.24689, false, false)).toEqual('3114.81S');
  });

  it('should convert negative lat to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(-68.987654, false, true)).toEqual('68° 59.26\' S');
  });

  it('should convert lon to DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(145.32, true, false)).toEqual('14519.20E');
  });

  it('should convert lon to padded DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(9.01, true, false)).toEqual('00900.60E');
  });

  it('should convert lon to DDM only displaying 2 decimal places (rounding up)', function() {
    expect(geo.toDegreesDecimalMinutes(123.456789, true, false)).toEqual('12327.41E');
  });

  it('should convert lon to DDM only displaying 2 decimal places (rounding down)', function() {
    expect(geo.toDegreesDecimalMinutes(54.1234, true, false)).toEqual('05407.40E');
  });

  it('should convert lon to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(154.1234, true, true)).toEqual('154° 07.40\' E');
  });

  it('should convert negative lon to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(-37.579, true, false)).toEqual('03734.74W');
  });

  it('should convert negative lon to padded DDM correctly', function() {
    expect(geo.toDegreesDecimalMinutes(-2.03, true, false)).toEqual('00201.80W');
  });

  it('should convert negative lon to DDM only displaying 2 decimal places (rounding up)', function() {
    expect(geo.toDegreesDecimalMinutes(-68.987654, true, false)).toEqual('06859.26W');
  });

  it('should convert negative lon to DDM only displaying 2 decimal places (rounding down)', function() {
    expect(geo.toDegreesDecimalMinutes(-131.24689, true, false)).toEqual('13114.81W');
  });

  it('should convert negative lon to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(-168.987654, true, true)).toEqual('168° 59.26\' W');
  });

  it('should convert negative lon to DDM with symbols (default args)', function() {
    expect(geo.toDegreesDecimalMinutes(-168.987654)).toEqual('168° 59.26\' W');
  });

  it('should convert lat close to whole degrees to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(68.9999999, false, false)).toEqual('6900.00N');
  });

  it('should convert lat close to whole degrees to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(68.9999999, false, true)).toEqual('69° 00.00\' N');
  });

  it('should convert negative lat close to whole degrees to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(-68.9999999, false, false)).toEqual('6900.00S');
  });

  it('should convert negative lat close to whole degrees to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(-68.9999999, false, true)).toEqual('69° 00.00\' S');
  });

  it('should convert lon close to whole degrees to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(168.9999999, true, false)).toEqual('16900.00E');
  });

  it('should convert lon close to whole degrees to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(168.9999999, true, true)).toEqual('169° 00.00\' E');
  });

  it('should convert negative lon close to whole degrees to DDM', function() {
    expect(geo.toDegreesDecimalMinutes(-168.9999999, true, false)).toEqual('16900.00W');
  });

  it('should convert negative lon close to whole degrees to DDM with symbols', function() {
    expect(geo.toDegreesDecimalMinutes(-168.9999999, true, true)).toEqual('169° 00.00\' W');
  });

  it('should convert lat to DMS correctly', function() {
    expect(geo.toSexagesimal(10.51, false, false)).toEqual('103036.00N');
  });

  it('should convert lat to DMS correctly (default args)', function() {
    expect(geo.toSexagesimal(10.51, false)).toEqual('10° 30\' 36.00" N');
  });

  it('should convert lat to padded DMS correctly', function() {
    expect(geo.toSexagesimal(5.01, false, false)).toEqual('050036.00N');
  });

  it('should convert lat to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(23.456789, false, false)).toEqual('232724.44N');
  });

  it('should convert lat to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(54.1234, false, false)).toEqual('540724.24N');
  });

  it('should convert lat to DMS with symbols', function() {
    expect(geo.toSexagesimal(54.1234, false, true)).toEqual('54° 07\' 24.24" N');
  });

  it('should convert negative lat to DMS', function() {
    expect(geo.toSexagesimal(-37.579, false, false)).toEqual('373444.40S');
  });

  it('should convert negative lat to padded DMS correctly', function() {
    expect(geo.toSexagesimal(-2.01, false, false)).toEqual('020036.00S');
  });

  it('should convert negative lat to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(-68.987654, false, false)).toEqual('685915.55S');
  });

  it('should convert negative lat to DMS only displaying 1 decimal place (rounding)', function() {
    expect(geo.toSexagesimal(-68.987654, false, false, 1)).toEqual('685915.6S');
  });

  it('should convert negative lat to DMS displaying 3 decimal place (rounding)', function() {
    expect(geo.toSexagesimal(-68.987654, false, false, 3)).toEqual('685915.554S');
  });

  it('should convert negative lat to DMS only displaying 0 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(-68.987654, false, false, 0)).toEqual('685916S');
  });

  it('should convert negative lat to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(-31.24689, false, false)).toEqual('311448.80S');
  });

  it('should convert negative lat to DMS with symbols', function() {
    expect(geo.toSexagesimal(-68.987654, false, true)).toEqual('68° 59\' 15.55" S');
  });

  it('should convert negative lat to DMS with symbols, 1 decimal place', function() {
    expect(geo.toSexagesimal(-68.987654, false, true, 1)).toEqual('68° 59\' 15.6" S');
  });

  it('should convert negative lat to DMS with symbols, 0 decimal place', function() {
    expect(geo.toSexagesimal(-68.987654, false, true, 0)).toEqual('68° 59\' 16" S');
  });

  it('should convert lon to DMS correctly', function() {
    expect(geo.toSexagesimal(145.32, true, false)).toEqual('1451912.00E');
  });

  it('should convert lon to DMS correctly (default args)', function() {
    expect(geo.toSexagesimal(145.32)).toEqual('145° 19\' 12.00" E');
  });

  it('should convert lon to padded DMS correctly', function() {
    expect(geo.toSexagesimal(9.01, true, false)).toEqual('0090036.00E');
  });

  it('should convert lon to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(123.456789, true, false)).toEqual('1232724.44E');
  });

  it('should convert lon to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(54.1234, true, false)).toEqual('0540724.24E');
  });

  it('should convert lon to DMS only displaying 1 decimal place (rounding)', function() {
    expect(geo.toSexagesimal(54.1234, true, false, 1)).toEqual('0540724.2E');
  });

  it('should convert lon to DMS with symbols', function() {
    expect(geo.toSexagesimal(154.1234, true, true)).toEqual('154° 07\' 24.24" E');
  });

  it('should convert lon to DMS with symbols, 1 decimal place', function() {
    expect(geo.toSexagesimal(154.1234, true, true, 1)).toEqual('154° 07\' 24.2" E');
  });

  it('should convert lon to DMS with symbols, 0 decimal places', function() {
    expect(geo.toSexagesimal(154.1234, true, true, 0)).toEqual('154° 07\' 24" E');
  });

  it('should convert negative lon to DMS', function() {
    expect(geo.toSexagesimal(-37.579, true, false)).toEqual('0373444.40W');
  });

  it('should convert negative lon to padded DMS correctly', function() {
    expect(geo.toSexagesimal(-2.03, true, false)).toEqual('0020148.00W');
  });

  it('should convert negative lon to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(-68.987654, true, false)).toEqual('0685915.55W');
  });

  it('should convert negative lon to DMS only displaying 2 decimal places (rounding)', function() {
    expect(geo.toSexagesimal(-131.24689, true, false)).toEqual('1311448.80W');
  });

  it('should convert negative lon to DMS with symbols', function() {
    expect(geo.toSexagesimal(-168.987654, true, true)).toEqual('168° 59\' 15.55" W');
  });

  it('should convert lat close to whole degrees to DMS', function() {
    expect(geo.toSexagesimal(68.9999999, false, false)).toEqual('690000.00N');
  });

  it('should convert lat close to whole minutes to DMS', function() {
    expect(geo.toSexagesimal(45.016666666, false, false)).toEqual('450100.00N');
  });

  it('should convert lat close to whole degrees to DMS with symbols', function() {
    expect(geo.toSexagesimal(68.9999999, false, true)).toEqual('69° 00\' 00.00" N');
  });

  it('should convert negative lat close to whole degrees to DMS', function() {
    expect(geo.toSexagesimal(-68.99999999999, false, false)).toEqual('690000.00S');
  });

  it('should convert negative lat close to whole minutes to DMS', function() {
    expect(geo.toSexagesimal(-45.016666666, false, false)).toEqual('450100.00S');
  });

  it('should convert negative lat close to whole degrees to DMS with symbols', function() {
    expect(geo.toSexagesimal(-68.9999999, false, true)).toEqual('69° 00\' 00.00" S');
  });

  it('should convert lon close to whole degrees to DMS', function() {
    expect(geo.toSexagesimal(168.9999999, true, false)).toEqual('1690000.00E');
  });

  it('should convert lon close to whole minutes to DMS', function() {
    expect(geo.toSexagesimal(145.016666666, true, false)).toEqual('1450100.00E');
  });

  it('should convert lon close to whole degrees to DMS with symbols', function() {
    expect(geo.toSexagesimal(168.9999999, true, true)).toEqual('169° 00\' 00.00" E');
  });

  it('should convert negative lon close to whole degrees to DMS', function() {
    expect(geo.toSexagesimal(-168.9999999, true, false)).toEqual('1690000.00W');
  });

  it('should convert negative lon close to whole minutes to DMS', function() {
    expect(geo.toSexagesimal(-145.01666666, true, false)).toEqual('1450100.00W');
  });

  it('should convert negative lon close to whole degrees to DMS with symbols', function() {
    expect(geo.toSexagesimal(-168.9999999, true, true)).toEqual('169° 00\' 00.00" W');
  });

  it('should test if two coordinates are the same', function() {
    // Including null always returns false
    expect(geo.isSameCoordinate(null, null)).toBe(false);
    expect(geo.isSameCoordinate([0, 0], null)).toBe(false);
    expect(geo.isSameCoordinate(null, [0, 0])).toBe(false);

    // Coordinates with fewer than 2 values always return false
    expect(geo.isSameCoordinate([0], [0])).toBe(false);
    expect(geo.isSameCoordinate([0], [0, 0])).toBe(false);
    expect(geo.isSameCoordinate([0, 0], [0])).toBe(false);

    // Same coordinates return true
    expect(geo.isSameCoordinate([0, 0], [0, 0])).toBe(true);
    expect(geo.isSameCoordinate([5, 10], [5, 10])).toBe(true);
    expect(geo.isSameCoordinate([12.345, 67.89], [12.345, 67.89])).toBe(true);

    // Both values must match
    expect(geo.isSameCoordinate([5, 10], [5, 11])).toBe(false);
    expect(geo.isSameCoordinate([5, 10], [6, 10])).toBe(false);
  });
});
