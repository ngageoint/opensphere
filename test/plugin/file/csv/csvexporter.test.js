goog.require('goog.object');
goog.require('os.Fields');
goog.require('os.osasm.wait');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('plugin.file.csv.CSVExporter');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

describe('plugin.file.csv.CSVExporter', function() {
  const googObject = goog.module.get('goog.object');
  const {default: Fields} = goog.module.get('os.Fields');
  const {default: TimeInstant} = goog.module.get('os.time.TimeInstant');
  const {default: TimeRange} = goog.module.get('os.time.TimeRange');
  const {default: CSVExporter} = goog.module.get('plugin.file.csv.CSVExporter');
  var ex = new CSVExporter();
  var lineFeature;
  var pointFeature;
  var polygonFeature;

  beforeEach(function() {
    lineFeature = new Feature(new LineString([[12, 34], [56, 78]]));
    pointFeature = new Feature(new Point([12, 34]));
    polygonFeature = new Feature(new Polygon([[[1, 2], [3, 4], [5, 6], [7, 8], [1, 2]]]));

    ex.reset();
  });

  it('should not process null features', function() {
    var result = ex.processItem(null);
    expect(result).toBeNull();
  });

  it('should process features lacking a geometry', function() {
    var props = {
      strKey: 'a',
      numKey: 5
    };

    ex.setFields(googObject.getKeys(props));
    var result = ex.processItem(new Feature(props));

    expect(result.strKey).toBe(props.strKey);
    expect(result.numKey).toBe(props.numKey);
  });

  it('should convert features with a point geometry to JSON', function() {
    var result = ex.processItem(pointFeature);

    expect(result[Fields.GEOMETRY].length).not.toBe(0);
  });

  it('should convert features with a linestring geometry to JSON', function() {
    var result = ex.processItem(lineFeature);

    expect(result[Fields.GEOMETRY].length).not.toBe(0);
  });

  it('should convert features with a polygon geometry to JSON', function() {
    var result = ex.processItem(polygonFeature);

    expect(result[Fields.GEOMETRY].length).not.toBe(0);
  });

  it('should translate fields to JSON', function() {
    var props = {
      strKey: 'a',
      numKey: 5,
      boolKey: true,
      arrKey: [],
      objKey: {},
      undefKey: undefined,
      nullKey: null
    };

    pointFeature.setProperties(props);
    ex.setFields(googObject.getKeys(props));

    var result = ex.processItem(pointFeature);

    expect(result.strKey).toBe(props.strKey);
    expect(result.numKey).toBe(props.numKey);
    expect(result.boolKey).toBe(props.boolKey);
    expect(result.arrKey).toBeUndefined();
    expect(result.objKey).toBeUndefined();
    expect(result.undefKey).toBe('');
    expect(result.nullKey).toBe('');
  });

  it('should prepend the UTF-8 byte order mark', function() {
    ex.setItems([pointFeature]);
    ex.process();
    expect(ex.getOutput().startsWith('\ufeff')).toBe(true);
    ex.setItems(null);
  });

  it('should export time instants correctly', function() {
    var props = {
      recordTime: new TimeInstant(999999)
    };

    pointFeature.setProperties(props);
    ex.setFields(googObject.getKeys(props));

    var result = ex.processItem(pointFeature);

    expect(result[Fields.TIME]).toBe('1970-01-01T00:16:39Z');
  });

  it('should export time ranges correctly', function() {
    var props = {
      recordTime: new TimeRange(999999, 9999999)
    };

    pointFeature.setProperties(props);
    ex.setFields(googObject.getKeys(props));

    var result = ex.processItem(pointFeature);

    expect(result[CSVExporter.FIELDS.START_TIME]).toBe('1970-01-01T00:16:39Z');
    expect(result[CSVExporter.FIELDS.END_TIME]).toBe('1970-01-01T02:46:39Z');
  });

  it('should export GEOMETRY when alwaysIncludeWkt is true', function() {
    ex.setAlwaysIncludeWkt(true);

    var result = ex.processItem(pointFeature);

    expect(result[Fields.GEOMETRY].length).not.toBe(0);
  });

  it('should not export GEOMETRY when alwaysIncludeWkt is false', function() {
    // Though there's nothing stopping the user from exporting their own WKT field
    ex.setAlwaysIncludeWkt(false);

    var result = ex.processItem(pointFeature);

    expect(result[Fields.GEOMETRY]).toBeUndefined();
  });
});
