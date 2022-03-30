import Feature from 'ol/src/Feature.js';
import GeometryCollection from 'ol/src/geom/GeometryCollection.js';
import Point from 'ol/src/geom/Point.js';
import Polygon from 'ol/src/geom/Polygon.js';

import DataManager from '../../../src/os/data/datamanager.js';
import RecordField from '../../../src/os/data/recordfield.js';
import {autoMap, getSemiMajor, getSemiMinor, createEllipse, createRings, filterFnGetter, VALUES_FIELD, removeFeatures, getTitle, getColor, getStrokeColor, getFillColor, hasPolygon} from '../../../src/os/feature/feature.js';
import Fields from '../../../src/os/fields/fields.js';
import {DEFAULT_SEMI_MAJ_COL_NAME, DEFAULT_SEMI_MIN_COL_NAME} from '../../../src/os/fields/index.js';
import {convertEllipseValue} from '../../../src/os/geo/geo.js';
import MappingManager from '../../../src/os/im/mapping/mappingmanager.js';
import {convertUnits} from '../../../src/os/math/math.js';
import Units from '../../../src/os/math/units.js';
import VectorSource from '../../../src/os/source/vectorsource.js';
import {DEFAULT_LAYER_COLOR, setFeatureStyle, DEFAULT_VECTOR_CONFIG, DEFAULT_FILL_COLOR} from '../../../src/os/style/style.js';
import StyleType from '../../../src/os/style/styletype.js';
import {getMockMappingManager} from '../os.mock.js';

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

  it('should auto detect and apply mappings on features', function() {
    // use a local mapping manager for this test
    spyOn(MappingManager, 'getInstance').andCallFake(getMockMappingManager);

    var f1 = new Feature({
      LAT: 0,
      LON: 0
    });

    var f2 = new Feature({
      LAT: 10,
      LON: 20
    });

    var f3 = new Feature({
      LAT: 30,
      LON: 40
    });

    var f1Geom = f1.getGeometry();
    var f2Geom = f2.getGeometry();
    var f3Geom = f3.getGeometry();

    expect(f1Geom).not.toBeDefined();
    expect(f2Geom).not.toBeDefined();
    expect(f3Geom).not.toBeDefined();

    autoMap([f1, f2, f3]);

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
    var center = new Point([0, 0]);
    var feature = new Feature(center);

    // no semi-major value defined
    expect(getSemiMajor(feature)).toBeUndefined();

    // non-numeric all return undefined
    feature.set(DEFAULT_SEMI_MAJ_COL_NAME, '');
    expect(getSemiMajor(feature)).toBeUndefined();

    feature.set(DEFAULT_SEMI_MAJ_COL_NAME, 'yes');
    expect(getSemiMajor(feature)).toBeUndefined();

    feature.set(Fields.SEMI_MAJOR, 'very yes');
    expect(getSemiMajor(feature)).toBeUndefined();

    // numeric values return in appropriate units

    // just nmi mapped value returns that value
    feature.set(DEFAULT_SEMI_MAJ_COL_NAME, 500);
    expect(getSemiMajor(feature)).toBe(500);
    expect(getSemiMajor(feature, Units.KILOMETERS)).toBe(
        convertUnits(500, Units.KILOMETERS, Units.NAUTICAL_MILES));
    expect(getSemiMajor(feature, Units.METERS)).toBe(
        convertUnits(500, Units.METERS, Units.NAUTICAL_MILES));

    // both fields uses the nmi mapped value
    feature.set(Fields.SEMI_MAJOR, 300);
    expect(getSemiMajor(feature)).toBe(500);

    // default field without units field uses implied units
    feature.unset(DEFAULT_SEMI_MAJ_COL_NAME);
    expect(getSemiMajor(feature)).toBe(convertEllipseValue(300));

    // default field with units field converts correctly
    feature.set(Fields.SEMI_MAJOR_UNITS, Units.KILOMETERS);
    expect(getSemiMajor(feature)).toBe(
        convertUnits(300, Units.NAUTICAL_MILES, Units.KILOMETERS));
    expect(getSemiMajor(feature, Units.KILOMETERS)).toBe(300);
  });

  it('should get ellipse semi-minor values', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);

    // no semi-minor value defined
    expect(getSemiMinor(feature)).toBeUndefined();

    // non-numeric all return undefined
    feature.set(DEFAULT_SEMI_MIN_COL_NAME, '');
    expect(getSemiMinor(feature)).toBeUndefined();

    feature.set(DEFAULT_SEMI_MIN_COL_NAME, 'yes');
    expect(getSemiMinor(feature)).toBeUndefined();

    feature.set(Fields.SEMI_MINOR, 'very yes');
    expect(getSemiMinor(feature)).toBeUndefined();

    // numeric values return in appropriate units

    // just nmi mapped value returns that value
    feature.set(DEFAULT_SEMI_MIN_COL_NAME, 500);
    expect(getSemiMinor(feature)).toBe(500);
    expect(getSemiMinor(feature, Units.KILOMETERS)).toBe(
        convertUnits(500, Units.KILOMETERS, Units.NAUTICAL_MILES));
    expect(getSemiMinor(feature, Units.METERS)).toBe(
        convertUnits(500, Units.METERS, Units.NAUTICAL_MILES));

    // both fields uses the nmi mapped value
    feature.set(Fields.SEMI_MINOR, 300);
    expect(getSemiMinor(feature)).toBe(500);

    // default field without units field uses implied units
    feature.unset(DEFAULT_SEMI_MIN_COL_NAME);
    expect(getSemiMinor(feature)).toBe(convertEllipseValue(300));

    // default field with units field converts correctly
    feature.set(Fields.SEMI_MINOR_UNITS, Units.KILOMETERS);
    expect(getSemiMinor(feature)).toBe(
        convertUnits(300, Units.NAUTICAL_MILES, Units.KILOMETERS));
    expect(getSemiMinor(feature, Units.KILOMETERS)).toBe(300);
  });

  it('should create an ellipse if the appropriate fields are available/valid', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(Fields.SEMI_MAJOR, 10);
    feature.set(Fields.SEMI_MINOR, 5);
    feature.set(Fields.ORIENTATION, 0);

    var ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // should only create once, then return the same ellipse
    expect(createEllipse(feature)).toBe(ellipse);

    // should replace an existing ellipse
    expect(createEllipse(feature, true)).not.toBe(ellipse);
  });

  it('should create an ellipse if the derived fields are available/valid', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(DEFAULT_SEMI_MAJ_COL_NAME, 10);
    feature.set(DEFAULT_SEMI_MIN_COL_NAME, 5);
    feature.set(Fields.ORIENTATION, 0);

    var ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // should only create once, then return the same ellipse
    expect(createEllipse(feature)).toBe(ellipse);

    // should replace an existing ellipse
    expect(createEllipse(feature, true)).not.toBe(ellipse);
  });

  it('should not create an ellipse when SEMI_MAJOR is invalid', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(Fields.SEMI_MINOR, 1);
    feature.set(Fields.ORIENTATION, 0);

    // test undefined SEMI_MAJOR
    expect(createEllipse(feature)).toBeUndefined();

    // test null SEMI_MAJOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MAJOR, null);
    expect(createEllipse(feature)).toBeUndefined();

    // test 0 SEMI_MAJOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MAJOR, 0);
    expect(createEllipse(feature)).toBeUndefined();

    // test valid SEMI_MAJOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MAJOR, 5);

    var ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should not create an ellipse when SEMI_MINOR is invalid', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(Fields.SEMI_MAJOR, 5);
    feature.set(Fields.ORIENTATION, 0);

    // test undefined SEMI_MINOR
    expect(createEllipse(feature)).toBeUndefined();

    // test null SEMI_MINOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MINOR, null);
    expect(createEllipse(feature)).toBeUndefined();

    // test 0 SEMI_MINOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MINOR, 0);
    expect(createEllipse(feature)).toBeUndefined();

    // test valid SEMI_MINOR
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.SEMI_MINOR, 1);

    var ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should not create an ellipse when ORIENTATION is invalid', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(Fields.SEMI_MAJOR, 5);
    feature.set(Fields.SEMI_MINOR, 1);

    // test undefined ORIENTATION
    expect(createEllipse(feature)).toBeUndefined();

    // test null ORIENTATION
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.ORIENTATION, null);
    expect(createEllipse(feature)).toBeUndefined();

    // test empty string ORIENTATION
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.ORIENTATION, '');
    expect(createEllipse(feature)).toBeUndefined();

    // test 0 ORIENTATION
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.ORIENTATION, 0);

    var ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);

    // test non-zero ORIENTATION
    feature.set(RecordField.ELLIPSE, undefined);
    feature.set(Fields.ORIENTATION, 1);

    ellipse = createEllipse(feature);
    expect(ellipse).toBeDefined();
    expect(testCoords(ellipse.getFlatCoordinates())).toBe(true);
  });

  it('should create rings when a feature has options on it', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(RecordField.RING_OPTIONS, {
      enabled: true,
      type: 'auto',
      interval: 40,
      units: Units.NAUTICAL_MILES,
      crosshair: false,
      arcs: false,
      labels: true,
      startAngle: 0,
      widthAngle: 0,
      rings: [
        {radius: 40, units: Units.NAUTICAL_MILES},
        {radius: 80, units: Units.NAUTICAL_MILES},
        {radius: 120, units: Units.NAUTICAL_MILES},
        {radius: 160, units: Units.NAUTICAL_MILES},
        {radius: 200, units: Units.NAUTICAL_MILES}
      ]
    });

    var rings = createRings(feature);
    expect(rings).toBeDefined();
    expect(rings instanceof GeometryCollection).toBe(true);

    var geometries = rings.getGeometries();
    expect(geometries.length).toBe(5);
    geometries.forEach(function(ring) {
      expect(testCoords(ring.getFlatCoordinates())).toBe(true);
    });

    // should only create once, then return the same geometry
    expect(createRings(feature)).toBe(rings);

    // should replace an existing geometry
    expect(createRings(feature, true)).not.toBe(rings);
  });

  it('should create rings with crosshairs', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(RecordField.RING_OPTIONS, {
      enabled: true,
      type: 'auto',
      interval: 20,
      units: Units.MILES,
      crosshair: true,
      arcs: false,
      labels: true,
      startAngle: 0,
      widthAngle: 0,
      rings: [
        {radius: 20, units: Units.MILES},
        {radius: 40, units: Units.MILES},
        {radius: 60, units: Units.MILES},
        {radius: 80, units: Units.MILES},
        {radius: 100, units: Units.MILES}
      ]
    });

    var rings = createRings(feature);
    expect(rings).toBeDefined();
    expect(rings instanceof GeometryCollection).toBe(true);

    var geometries = rings.getGeometries();
    expect(geometries.length).toBe(7);
    geometries.forEach(function(ring) {
      expect(testCoords(ring.getFlatCoordinates())).toBe(true);
    });
  });

  it('should create rings with arcs', function() {
    var center = new Point([0, 0]);
    var feature = new Feature(center);
    feature.set(RecordField.RING_OPTIONS, {
      enabled: true,
      type: 'manual',
      interval: 20,
      units: Units.MILES,
      crosshair: true,
      arcs: true,
      labels: true,
      startAngle: 20,
      widthAngle: 70,
      rings: [
        {radius: 20, units: Units.MILES},
        {radius: 40, units: Units.MILES},
        {radius: 60, units: Units.MILES},
        {radius: 80, units: Units.MILES},
        {radius: 100, units: Units.MILES}
      ]
    });

    var rings = createRings(feature);
    expect(rings).toBeDefined();
    expect(rings instanceof GeometryCollection).toBe(true);

    var geometries = rings.getGeometries();
    expect(geometries.length).toBe(7);
    geometries.forEach(function(ring) {
      expect(testCoords(ring.getFlatCoordinates())).toBe(true);
    });
  });

  it('should create an expression to get a value from a feature', function() {
    filterFnGetter();

    var feature = new Feature({
      'field1': 10,
      'field"2"': 20
    });

    // avoid no-unused-vars lint error
    expect(feature).toBeDefined();

    var getter = filterFnGetter('feature', 'field1');
    expect(getter).toBe('feature.values_ ? feature.values_["field1"] : undefined');
    expect(eval(getter)).toBe(10);

    getter = filterFnGetter('feature', 'field"2"');
    expect(getter).toBe('feature.values_ ? feature.values_["field\\"2\\""] : undefined');
    expect(eval(getter)).toBe(20);

    getter = filterFnGetter('feature', 'field3');
    expect(getter).toBe('feature.values_ ? feature.values_["field3"] : undefined');
    expect(eval(getter)).toBeUndefined();
  });

  it('should capture the ol.Feature values property', function() {
    var feature = new Feature({
      testProperty: 'testValue'
    });

    expect(VALUES_FIELD).toBeDefined();
    expect(feature[VALUES_FIELD]['testProperty']).toBe('testValue');

    feature[VALUES_FIELD]['testProperty'] = 'newValue';
    expect(feature.get('testProperty')).toBe('newValue');
  });

  describe('removeFeatures', function() {
    var src;

    it('should initialize the source for testing', function() {
      src = new VectorSource();
      src.setId('testy');

      var initFeatures = [];
      for (var i = 0; i < 5; i++) {
        var f = new Feature();
        f.setId('' + i);
        f.setGeometry(new Point([0, 0]));
        initFeatures.push(f);
      }

      src.addFeatures(initFeatures);
      DataManager.getInstance().addSource(src);
    });

    it('should not fail when source id does not exist', function() {
      try {
        removeFeatures('bogus', []);
      } catch (e) {
        fail('should not have bombed out because of a non-existent source id');
      }
    });

    it('should not fail or do anything when features are not provided', function() {
      try {
        var count = src.getFeatures().length;

        removeFeatures(src.getId(), null);
        removeFeatures(src.getId(), []);

        expect(src.getFeatures().length).toBe(count);
        expect(src.getFeatureCount()).toBe(count);
      } catch (e) {
        fail('should not fail when features are not provided');
      }
    });

    it('should remove the given features from the source', function() {
      var count = src.getFeatures().length;
      var features = src.getFeatures().slice(0, 2);

      removeFeatures(src.getId(), features);
      expect(src.getFeatures().length).toBe(count - features.length);
      expect(src.getFeatureCount()).toBe(count - features.length);
    });

    it('should remove the source from DataManager', function() {
      DataManager.getInstance().removeSource(src);
    });

    it('should get a title from a feature', function() {
      var feature = new Feature();
      expect(getTitle(feature)).toBeUndefined();

      // empty string returns undefined
      feature.set('name', '');
      feature.set('title', '');
      expect(getTitle(feature)).toBeUndefined();

      // name is returned
      feature.set('name', 'test1');
      expect(getTitle(feature)).toBe('test1');

      // case insensitive
      feature.unset('name');
      feature.set('Name', 'test2');
      expect(getTitle(feature)).toBe('test2');

      // title is returned
      feature.unset('Name');
      feature.set('title', 'test3');
      expect(getTitle(feature)).toBe('test3');

      // case insensitive
      feature.unset('title');
      feature.set('TITLE', 'test4');
      expect(getTitle(feature)).toBe('test4');
    });

    it('should get a color from a feature', function() {
      var spySource = null;

      var dataManager = DataManager.getInstance();
      spyOn(dataManager, 'getSource').andCallFake(() => spySource);

      var feature = new Feature({
        // this doesn't matter, just needs to be defined to call the getSource spy
        [RecordField.SOURCE_ID]: 'test-id'
      });
      var testColor = 'rgba(12,34,56,.1)';
      var sourceColor = 'rgba(98,76,54,.2)';
      var featureConfig1 = {};
      var featureConfig2 = {
        color: testColor
      };
      var source = {
        getColor: function() {
          return sourceColor;
        }
      };

      // should return the app default color when no feature provided
      expect(getColor(null)).toBe(DEFAULT_LAYER_COLOR);
      // or when a feature provided
      expect(getColor(feature)).toBe(DEFAULT_LAYER_COLOR);
      // unless a specific default color was specified
      expect(getColor(feature, undefined, testColor)).toBe(testColor);
      // or a source was provided
      expect(getColor(feature, source)).toBe(sourceColor);
      // or a source was available on the feature
      spySource = source;
      expect(getColor(feature)).toBe(sourceColor);

      spySource = null;

      // uses feature base color override
      feature.set(RecordField.COLOR, testColor);
      expect(getColor(feature)).toBe(testColor);
      feature.unset(RecordField.COLOR);

      // empty config returns default color
      feature.set(StyleType.FEATURE, featureConfig1);
      expect(getColor(feature)).toBe(DEFAULT_LAYER_COLOR);

      // should return the base config color
      featureConfig1.color = testColor;
      expect(getColor(feature)).toBe(testColor);
      delete featureConfig1.color;

      // should return the fill color
      featureConfig1.fill = {
        color: testColor
      };
      expect(getColor(feature)).toBe(testColor);
      delete featureConfig1.fill;

      // should return the image color
      featureConfig1.image = {
        color: testColor
      };
      expect(getColor(feature)).toBe(testColor);
      delete featureConfig1.image;

      // should return the stroke color
      featureConfig1.stroke = {
        color: testColor,
        width: 2
      };
      expect(getColor(feature)).toBe(testColor);
      delete featureConfig1.stroke;

      // should find a color in other configs
      feature.set(StyleType.FEATURE, [featureConfig1, featureConfig2]);
      expect(getColor(feature)).toBe(testColor);
    });

    it('should get a fill color from a feature', function() {
      var feature = new Feature();
      var testColor = 'rgba(0,255,0,1)';
      var featureConfig1 = {};
      var featureConfig2 = {
        fill: null
      };

      // defaults to null (no fill) when no feature provided
      expect(getFillColor(null)).toBeNull();
      // unless a default color was provided
      expect(getFillColor(null, undefined, DEFAULT_LAYER_COLOR)).toBe(DEFAULT_LAYER_COLOR);

      // defaults to null (no fill)
      expect(getFillColor(feature)).toBeNull();


      // empty config returns null
      feature.set(StyleType.FEATURE, featureConfig1);
      expect(getFillColor(feature)).toBeNull();

      // use auto color when set
      feature.set(RecordField.COLOR, testColor);
      expect(getFillColor(feature)).toBe(testColor);
      feature.unset(RecordField.COLOR);

      // should not return the stroke/image color
      featureConfig1.stroke = {
        color: testColor,
        width: 2
      };
      featureConfig1.image = {
        color: testColor
      };
      expect(getFillColor(feature)).toBeNull();

      // should not return the base config color
      featureConfig1.color = testColor;
      expect(getFillColor(feature)).toBeNull();

      // unless the fill is explicitly null
      featureConfig1.fill = null;
      expect(getFillColor(feature)).toBeNull();

      // gets the fill color
      featureConfig1.fill = {
        color: testColor
      };
      expect(getFillColor(feature)).toBe(testColor);

      // gets null from the first config
      feature.set(StyleType.FEATURE, [featureConfig2, featureConfig1]);
      expect(getFillColor(feature)).toBeNull();

      // gets the fill color from the second config
      featureConfig2.fill = undefined;
      expect(getFillColor(feature)).toBe(testColor);
    });

    it('should get a stroke color from a feature', function() {
      var feature = new Feature();
      var testColor = 'rgba(0,255,0,1)';
      var featureConfig1 = {};
      var featureConfig2 = {
        stroke: null
      };

      // defaults to null (no stroke) when no feature provided
      expect(getStrokeColor(null)).toBeNull();
      // unless a default color was provided
      expect(getStrokeColor(null, undefined, DEFAULT_LAYER_COLOR))
          .toBe(DEFAULT_LAYER_COLOR);

      // defaults to null (no stroke)
      expect(getStrokeColor(feature)).toBeNull();

      // use auto color when set
      feature.set(RecordField.COLOR, testColor);
      expect(getStrokeColor(feature)).toBe(testColor);
      feature.unset(RecordField.COLOR);

      // empty config returns null
      feature.set(StyleType.FEATURE, featureConfig1);
      expect(getStrokeColor(feature)).toBeNull();

      // should not return the fill/image color
      featureConfig1.fill = {
        color: testColor
      };
      featureConfig1.image = {
        color: testColor
      };
      expect(getStrokeColor(feature)).toBeNull();

      // should not return the base config color
      featureConfig1.color = testColor;
      expect(getStrokeColor(feature)).toBeNull();

      // unless the stroke is explicitly null
      featureConfig1.stroke = null;
      expect(getStrokeColor(feature)).toBeNull();

      // gets the stroke color
      featureConfig1.stroke = {
        color: testColor,
        width: 2
      };
      expect(getStrokeColor(feature)).toBe(testColor);

      // gets null from the first config
      feature.set(StyleType.FEATURE, [featureConfig2, featureConfig1]);
      expect(getStrokeColor(feature)).toBeNull();

      // gets the stroke color from the second config
      featureConfig2.stroke = undefined;
      expect(getStrokeColor(feature)).toBe(testColor);
    });

    it('detects if a feature has a polygon', function() {
      var feature;

      // handles null/undefined feature
      expect(hasPolygon(feature)).toBe(false);

      // no geometry
      feature = new Feature();
      expect(hasPolygon(feature)).toBe(false);

      // no style, main geom is not a polygon
      feature.setGeometry(new Point([]));
      expect(hasPolygon(feature)).toBe(false);

      // no style, main geom is a polygon
      feature.setGeometry(new Polygon([]));
      expect(hasPolygon(feature)).toBe(true);

      // default style
      setFeatureStyle(feature);
      expect(hasPolygon(feature)).toBe(true);

      // default style with a point
      feature.setGeometry(new Point([]));
      expect(hasPolygon(feature)).toBe(false);

      var styles = [
        DEFAULT_VECTOR_CONFIG,
        {
          geometry: '_polygonField',
          fill: {
            color: DEFAULT_FILL_COLOR
          },
          stroke: {
            color: DEFAULT_LAYER_COLOR,
            width: 3
          }
        }
      ];

      // secondary polygon config defined, geometry is not defined yet
      feature.set(StyleType.FEATURE, styles);
      setFeatureStyle(feature);
      expect(hasPolygon(feature)).toBe(false);

      // polygon added in secondary field
      feature.set('_polygonField', new Polygon([]));
      expect(hasPolygon(feature)).toBe(true);
    });
  });
});
