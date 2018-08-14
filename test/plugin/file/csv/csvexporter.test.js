goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.geom.Point');
goog.require('os.Fields');
goog.require('os.osasm.wait');
goog.require('os.time.TimeInstant');
goog.require('os.time.TimeRange');
goog.require('plugin.file.csv.CSVExporter');


describe('plugin.file.csv.CSVExporter', function() {
  var ex = new plugin.file.csv.CSVExporter();
  var lineFeature;
  var pointFeature;
  var polygonFeature;

  beforeEach(function() {
    lineFeature = new ol.Feature(new ol.geom.LineString([[12, 34], [56, 78]]));
    pointFeature = new ol.Feature(new ol.geom.Point([12, 34]));
    polygonFeature = new ol.Feature(new ol.geom.Polygon([[[1, 2], [3, 4], [5, 6], [7, 8], [1, 2]]]));

    ex.reset();
  });

  it('does not process null features', function() {
    var result = ex.processItem(null);
    expect(result).toBeNull();
  });

  it('does not process features lacking a geometry', function() {
    var result = ex.processItem(new ol.Feature());
    expect(result).toBeNull();
  });

  it('converts features with a point geometry to JSON', function() {
    var result = ex.processItem(pointFeature);

    expect(result[os.Fields.LAT].length).not.toBe(0);
    expect(result[os.Fields.LON].length).not.toBe(0);
    expect(result[os.Fields.LAT_DMS].length).not.toBe(0);
    expect(result[os.Fields.LON_DMS].length).not.toBe(0);
    expect(result[os.Fields.MGRS].length).not.toBe(0);
    expect(result[os.Fields.GEOMETRY].length).not.toBe(0);
  });

  it('converts features with a linestring geometry to JSON', function() {
    var result = ex.processItem(lineFeature);

    expect(result[os.Fields.LAT].length).toBe(0);
    expect(result[os.Fields.LON].length).toBe(0);
    expect(result[os.Fields.LAT_DMS].length).toBe(0);
    expect(result[os.Fields.LON_DMS].length).toBe(0);
    expect(result[os.Fields.MGRS].length).toBe(0);
    expect(result[os.Fields.GEOMETRY].length).not.toBe(0);
  });

  it('converts features with a polygon geometry to JSON', function() {
    var result = ex.processItem(polygonFeature);

    expect(result[os.Fields.LAT].length).toBe(0);
    expect(result[os.Fields.LON].length).toBe(0);
    expect(result[os.Fields.LAT_DMS].length).toBe(0);
    expect(result[os.Fields.LON_DMS].length).toBe(0);
    expect(result[os.Fields.MGRS].length).toBe(0);
    expect(result[os.Fields.GEOMETRY].length).not.toBe(0);
  });

  it('translates fields to JSON', function() {
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
    ex.setFields(goog.object.getKeys(props));

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

  it('exports time instants correctly', function() {
    var props = {
      recordTime: new os.time.TimeInstant(999999)
    };

    pointFeature.setProperties(props);
    ex.setFields(goog.object.getKeys(props));

    var result = ex.processItem(pointFeature);

    expect(result[os.Fields.TIME]).toBe('1970-01-01 00:16:39Z');
  });

  it('exports time ranges correctly', function() {
    var props = {
      recordTime: new os.time.TimeRange(999999, 9999999)
    };

    pointFeature.setProperties(props);
    ex.setFields(goog.object.getKeys(props));

    var result = ex.processItem(pointFeature);

    expect(result[plugin.file.csv.CSVExporter.FIELDS.START_TIME]).toBe('1970-01-01 00:16:39Z');
    expect(result[plugin.file.csv.CSVExporter.FIELDS.END_TIME]).toBe('1970-01-01 02:46:39Z');
  });
});
