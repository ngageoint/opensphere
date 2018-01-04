goog.require('ol.Feature');
goog.require('os.feature');
goog.require('os.mock');
goog.require('os.source.Vector');
goog.require('os.osasm.wait');


describe('os.feature', function() {
  var testCoords = function(coordinates, opt_expected) {
    for (var i = 0; i < coordinates.length; i++) {
      if (isNaN(coordinates[i]) || coordinates[i] == null) {
        return false;
      }
      if (opt_expected && opt_expected[i] != null && opt_expected[i] != coordinates[i]) {
        return false;
      }
    }

    return true;
  };

  os.osasm.wait.waitForIt();

  it('should auto detect and apply mappings on features', function() {
    // use a local mapping manager for this test
    spyOn(os.im.mapping.MappingManager, 'getInstance').andCallFake(os.mock.getMockMappingManager);

    var f1 = new ol.Feature({
      LAT: 0,
      LON: 0
    });

    var f2 = new ol.Feature({
      LAT: 10,
      LON: 20
    });

    var f3 = new ol.Feature({
      LAT: 30,
      LON: 40
    });

    var f1Geom = f1.getGeometry();
    var f2Geom = f2.getGeometry();
    var f3Geom = f3.getGeometry();

    expect(f1Geom).not.toBeDefined();
    expect(f2Geom).not.toBeDefined();
    expect(f3Geom).not.toBeDefined();

    os.feature.autoMap([f1, f2, f3]);

    f1Geom = f1.getGeometry();
    f2Geom = f2.getGeometry();
    f3Geom = f3.getGeometry();

    expect(f1Geom).toBeDefined();
    expect(f2Geom).toBeDefined();
    expect(f3Geom).toBeDefined();

    expect(testCoords(f1Geom.getFlatCoordinates(), [0, 0])).toBe(true);
    expect(testCoords(f2Geom.getFlatCoordinates(), [20, 10])).toBe(true);
    expect(testCoords(f3Geom.getFlatCoordinates(), [40, 30])).toBe(true);
  });

  it('should get ellipse semi-major values', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);

    // no semi-major value defined
    expect(os.feature.getSemiMajor(feature)).toBeUndefined();

    // non-numeric all return undefined
    feature.set(os.fields.DEFAULT_SEMI_MAJ_COL_NAME, '');
    expect(os.feature.getSemiMajor(feature)).toBeUndefined();

    feature.set(os.fields.DEFAULT_SEMI_MAJ_COL_NAME, 'yes');
    expect(os.feature.getSemiMajor(feature)).toBeUndefined();

    feature.set(os.Fields.SEMI_MAJOR, 'very yes');
    expect(os.feature.getSemiMajor(feature)).toBeUndefined();

    // numeric values return in appropriate units

    // just nmi mapped value returns that value
    feature.set(os.fields.DEFAULT_SEMI_MAJ_COL_NAME, 500);
    expect(os.feature.getSemiMajor(feature)).toBe(500);
    expect(os.feature.getSemiMajor(feature, os.math.Units.KILOMETERS)).toBe(
        os.math.convertUnits(500, os.math.Units.KILOMETERS, os.math.Units.NAUTICAL_MILES));
    expect(os.feature.getSemiMajor(feature, os.math.Units.METERS)).toBe(
        os.math.convertUnits(500, os.math.Units.METERS, os.math.Units.NAUTICAL_MILES));

    // both fields uses the nmi mapped value
    feature.set(os.Fields.SEMI_MAJOR, 300);
    expect(os.feature.getSemiMajor(feature)).toBe(500);

    // default field without units field uses implied units
    feature.unset(os.fields.DEFAULT_SEMI_MAJ_COL_NAME);
    expect(os.feature.getSemiMajor(feature)).toBe(os.geo.convertEllipseValue(300));

    // default field with units field converts correctly
    feature.set(os.Fields.SEMI_MAJOR_UNITS, os.math.Units.KILOMETERS);
    expect(os.feature.getSemiMajor(feature)).toBe(
        os.math.convertUnits(300, os.math.Units.NAUTICAL_MILES, os.math.Units.KILOMETERS));
    expect(os.feature.getSemiMajor(feature, os.math.Units.KILOMETERS)).toBe(300);
  });

  it('should get ellipse semi-minor values', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);

    // no semi-minor value defined
    expect(os.feature.getSemiMinor(feature)).toBeUndefined();

    // non-numeric all return undefined
    feature.set(os.fields.DEFAULT_SEMI_MIN_COL_NAME, '');
    expect(os.feature.getSemiMinor(feature)).toBeUndefined();

    feature.set(os.fields.DEFAULT_SEMI_MIN_COL_NAME, 'yes');
    expect(os.feature.getSemiMinor(feature)).toBeUndefined();

    feature.set(os.Fields.SEMI_MINOR, 'very yes');
    expect(os.feature.getSemiMinor(feature)).toBeUndefined();

    // numeric values return in appropriate units

    // just nmi mapped value returns that value
    feature.set(os.fields.DEFAULT_SEMI_MIN_COL_NAME, 500);
    expect(os.feature.getSemiMinor(feature)).toBe(500);
    expect(os.feature.getSemiMinor(feature, os.math.Units.KILOMETERS)).toBe(
        os.math.convertUnits(500, os.math.Units.KILOMETERS, os.math.Units.NAUTICAL_MILES));
    expect(os.feature.getSemiMinor(feature, os.math.Units.METERS)).toBe(
        os.math.convertUnits(500, os.math.Units.METERS, os.math.Units.NAUTICAL_MILES));

    // both fields uses the nmi mapped value
    feature.set(os.Fields.SEMI_MINOR, 300);
    expect(os.feature.getSemiMinor(feature)).toBe(500);

    // default field without units field uses implied units
    feature.unset(os.fields.DEFAULT_SEMI_MIN_COL_NAME);
    expect(os.feature.getSemiMinor(feature)).toBe(os.geo.convertEllipseValue(300));

    // default field with units field converts correctly
    feature.set(os.Fields.SEMI_MINOR_UNITS, os.math.Units.KILOMETERS);
    expect(os.feature.getSemiMinor(feature)).toBe(
        os.math.convertUnits(300, os.math.Units.NAUTICAL_MILES, os.math.Units.KILOMETERS));
    expect(os.feature.getSemiMinor(feature, os.math.Units.KILOMETERS)).toBe(300);
  });

  it('should create an ellipse if the appropriate fields are available/valid', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);
    feature.set(os.Fields.SEMI_MAJOR, 10);
    feature.set(os.Fields.SEMI_MINOR, 5);
    feature.set(os.Fields.ORIENTATION, 0);

    var ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // should only create once, then return the same ellipse
    expect(os.feature.createEllipse(feature)).toBe(ellipse);

    // should replace an existing ellipse
    expect(os.feature.createEllipse(feature, true)).not.toBe(ellipse);
  });

  it('should create an ellipse if the derived fields are available/valid', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);
    feature.set(os.fields.DEFAULT_SEMI_MAJ_COL_NAME, 10);
    feature.set(os.fields.DEFAULT_SEMI_MIN_COL_NAME, 5);
    feature.set(os.Fields.ORIENTATION, 0);

    var ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // should only create once, then return the same ellipse
    expect(os.feature.createEllipse(feature)).toBe(ellipse);

    // should replace an existing ellipse
    expect(os.feature.createEllipse(feature, true)).not.toBe(ellipse);
  });

  it('should not create an ellipse when SEMI_MAJOR is invalid', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);
    feature.set(os.Fields.SEMI_MINOR, 1);
    feature.set(os.Fields.ORIENTATION, 0);

    // test undefined SEMI_MAJOR
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test null SEMI_MAJOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MAJOR, null);
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test 0 SEMI_MAJOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MAJOR, 0);
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test valid SEMI_MAJOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MAJOR, 5);

    var ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should not create an ellipse when SEMI_MINOR is invalid', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);
    feature.set(os.Fields.SEMI_MAJOR, 5);
    feature.set(os.Fields.ORIENTATION, 0);

    // test undefined SEMI_MINOR
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test null SEMI_MINOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MINOR, null);
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test 0 SEMI_MINOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MINOR, 0);
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test valid SEMI_MINOR
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.SEMI_MINOR, 1);

    var ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should not create an ellipse when ORIENTATION is invalid', function() {
    var center = new ol.geom.Point([0, 0]);
    var feature = new ol.Feature(center);
    feature.set(os.Fields.SEMI_MAJOR, 5);
    feature.set(os.Fields.SEMI_MINOR, 1);

    // test undefined ORIENTATION
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test null ORIENTATION
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.ORIENTATION, null);
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test empty string ORIENTATION
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.ORIENTATION, '');
    expect(os.feature.createEllipse(feature)).toBeUndefined();

    // test 0 ORIENTATION
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.ORIENTATION, 0);

    var ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // test non-zero ORIENTATION
    feature.set(os.data.RecordField.ELLIPSE, undefined);
    feature.set(os.Fields.ORIENTATION, 1);

    ellipse = os.feature.createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should create an expression to get a value from a feature', function() {
    os.feature.filterFnGetter();

    var feature = new ol.Feature({
      'field1': 10,
      'field"2"': 20
    });

    // avoid no-unused-vars lint error
    expect(feature).toBeDefined();

    var getter = os.feature.filterFnGetter('feature', 'field1');
    expect(getter).toBe('feature.values_["field1"]');
    expect(eval(getter)).toBe(10);

    getter = os.feature.filterFnGetter('feature', 'field"2"');
    expect(getter).toBe('feature.values_["field\\"2\\""]');
    expect(eval(getter)).toBe(20);

    getter = os.feature.filterFnGetter('feature', 'field3');
    expect(getter).toBe('feature.values_["field3"]');
    expect(eval(getter)).toBeUndefined();
  });

  it('should capture the ol.Feature values property', function() {
    var feature = new ol.Feature({
      testProperty: 'testValue'
    });

    expect(os.feature.VALUES_FIELD_).toBeDefined();
    expect(feature[os.feature.VALUES_FIELD_]['testProperty']).toBe('testValue');

    feature[os.feature.VALUES_FIELD_]['testProperty'] = 'newValue';
    expect(feature.get('testProperty')).toBe('newValue');
  });

  describe('removeFeatures', function() {
    var src;

    it('should initialize the source for testing', function() {
      src = new os.source.Vector();
      src.setId('testy');

      var initFeatures = [];
      for (var i = 0; i < 5; i++) {
        var f = new ol.Feature();
        f.setId('' + i);
        f.setGeometry(new ol.geom.Point([0, 0]));
        initFeatures.push(f);
      }

      src.addFeatures(initFeatures);
      os.osDataManager.addSource(src);
    });

    it('should not fail when source id does not exist', function() {
      try {
        os.feature.removeFeatures('bogus', []);
      } catch (e) {
        fail('should not have bombed out because of a non-existent source id');
      }
    });

    it('should not fail or do anything when features are not provided', function() {
      try {
        var count = src.getFeatures().length;

        os.feature.removeFeatures(src.getId(), null);
        os.feature.removeFeatures(src.getId(), []);

        expect(src.getFeatures().length).toBe(count);
        expect(src.getFeatureCount()).toBe(count);
      } catch (e) {
        fail('should not fail when features are not provided');
      }
    });

    it('should remove the given features from the source', function() {
      var count = src.getFeatures().length;
      var features = src.getFeatures().slice(0, 2);

      os.feature.removeFeatures(src.getId(), features);
      expect(src.getFeatures().length).toBe(count - features.length);
      expect(src.getFeatureCount()).toBe(count - features.length);
    });

    it('should remove the source from DataManager', function() {
      os.osDataManager.removeSource(src);
    });

    it('should get a title from a feature', function() {
      var feature = new ol.Feature();
      expect(os.feature.getTitle(feature)).toBeUndefined();

      // empty string returns undefined
      feature.set('name', '');
      feature.set('title', '');
      expect(os.feature.getTitle(feature)).toBeUndefined();

      // name is returned
      feature.set('name', 'test1');
      expect(os.feature.getTitle(feature)).toBe('test1');

      // case insensitive
      feature.unset('name');
      feature.set('Name', 'test2');
      expect(os.feature.getTitle(feature)).toBe('test2');

      // title is returned
      feature.unset('Name');
      feature.set('title', 'test3');
      expect(os.feature.getTitle(feature)).toBe('test3');

      // case insensitive
      feature.unset('title');
      feature.set('TITLE', 'test4');
      expect(os.feature.getTitle(feature)).toBe('test4');
    });
  });
});
