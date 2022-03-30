goog.require('os.feature.DynamicFeature');
goog.require('os.geom.Ellipse');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.DynamicLineStringConverter');
goog.require('plugin.cesium.sync.DynamicMultiPolygonConverter');
goog.require('plugin.cesium.sync.DynamicPolygonConverter');
goog.require('plugin.cesium.sync.EllipseConverter');
goog.require('plugin.cesium.sync.GeometryCollectionConverter');
goog.require('plugin.cesium.sync.LabelConverter');
goog.require('plugin.cesium.sync.LineStringConverter');
goog.require('plugin.cesium.sync.MultiDynamicLineStringConverter');
goog.require('plugin.cesium.sync.MultiLineStringConverter');
goog.require('plugin.cesium.sync.MultiPointConverter');
goog.require('plugin.cesium.sync.MultiPolygonConverter');
goog.require('plugin.cesium.sync.PointConverter');
goog.require('plugin.cesium.sync.PolygonConverter');
goog.require('plugin.cesium.sync.converter');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import GeometryType from 'ol/src/geom/GeometryType.js';
import Point from 'ol/src/geom/Point.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';
import Text from 'ol/src/style/Text.js';

describe('plugin.cesium.sync.converter', () => {
  const {convertGeometry, getConverter} = goog.module.get('plugin.cesium.sync.converter');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const {default: DynamicLineStringConverter} = goog.module.get('plugin.cesium.sync.DynamicLineStringConverter');
  const {default: Ellipse} = goog.module.get('os.geom.Ellipse');
  const {default: Vector} = goog.module.get('os.layer.Vector');
  const {EPSG4326} = goog.module.get('os.proj');

  const {default: EllipseConverter} = goog.module.get('plugin.cesium.sync.EllipseConverter');
  const {default: GeometryCollectionConverter} = goog.module.get('plugin.cesium.sync.GeometryCollectionConverter');
  const {default: LabelConverter} = goog.module.get('plugin.cesium.sync.LabelConverter');
  const {default: LineStringConverter} = goog.module.get('plugin.cesium.sync.LineStringConverter');
  const {default: MultiDynamicLineStringConverter} =
    goog.module.get('plugin.cesium.sync.MultiDynamicLineStringConverter');
  const {default: MultiLineStringConverter} = goog.module.get('plugin.cesium.sync.MultiLineStringConverter');
  const {default: MultiPointConverter} = goog.module.get('plugin.cesium.sync.MultiPointConverter');
  const {default: MultiPolygonConverter} = goog.module.get('plugin.cesium.sync.MultiPolygonConverter');
  const {default: PointConverter} = goog.module.get('plugin.cesium.sync.PointConverter');
  const {default: PolygonConverter} = goog.module.get('plugin.cesium.sync.PolygonConverter');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: DynamicPolygonConverter} = goog.module.get('plugin.cesium.sync.DynamicPolygonConverter');
  const {default: DynamicMultiPolygonConverter} = goog.module.get('plugin.cesium.sync.DynamicMultiPolygonConverter');

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    geometry = new Point([0, 0]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(EPSG4326));
  });

  describe('converterGeometry', () => {
    it('should get the converter and run it', () => {
      const fn = () => convertGeometry(feature, geometry, style, context);
      expect(fn).not.toThrow();
    });
  });

  describe('getConverter', () => {
    const runTests = (tests) => {
      let geomType;
      geometry.getType = () => geomType;

      for (const type in tests) {
        geomType = type;
        const result = getConverter(feature, geometry, style, context);
        expect(result instanceof tests[type]).toBe(true);

        // ensure instances are cached
        const result2 = getConverter(feature, geometry, style, context);
        expect(result).toBe(result2);
      }
    };

    it('should return the correct converter for the geometry type', () => {
      runTests({
        [GeometryType.GEOMETRY_COLLECTION]: GeometryCollectionConverter,
        [GeometryType.LINE_STRING]: LineStringConverter,
        [GeometryType.MULTI_LINE_STRING]: MultiLineStringConverter,
        [GeometryType.MULTI_POINT]: MultiPointConverter,
        [GeometryType.MULTI_POLYGON]: MultiPolygonConverter,
        [GeometryType.POINT]: PointConverter,
        [GeometryType.POLYGON]: PolygonConverter
      });
    });

    it('should return the ellipse converter for ellipse geometries', () => {
      geometry = new Ellipse([0, 0], 100000, 50000, 45);
      runTests({
        [GeometryType.GEOMETRY_COLLECTION]: EllipseConverter,
        [GeometryType.LINE_STRING]: EllipseConverter,
        [GeometryType.MULTI_LINE_STRING]: EllipseConverter,
        [GeometryType.MULTI_POINT]: EllipseConverter,
        [GeometryType.MULTI_POLYGON]: EllipseConverter,
        [GeometryType.POINT]: EllipseConverter,
        [GeometryType.POLYGON]: EllipseConverter
      });
    });

    it('should return the dynamic converters for dynamic features', () => {
      feature = new DynamicFeature(geometry);
      runTests({
        [GeometryType.GEOMETRY_COLLECTION]: GeometryCollectionConverter,
        [GeometryType.LINE_STRING]: DynamicLineStringConverter,
        [GeometryType.MULTI_LINE_STRING]: MultiDynamicLineStringConverter,
        [GeometryType.MULTI_POINT]: MultiPointConverter,
        [GeometryType.MULTI_POLYGON]: DynamicMultiPolygonConverter,
        [GeometryType.POINT]: PointConverter,
        [GeometryType.POLYGON]: DynamicPolygonConverter
      });
    });

    it('should return the label converter if the style contains a text style', () => {
      style.setText(new Text());
      runTests({
        [GeometryType.GEOMETRY_COLLECTION]: LabelConverter,
        [GeometryType.LINE_STRING]: LabelConverter,
        [GeometryType.MULTI_LINE_STRING]: LabelConverter,
        [GeometryType.MULTI_POINT]: LabelConverter,
        [GeometryType.MULTI_POLYGON]: LabelConverter,
        [GeometryType.POINT]: LabelConverter,
        [GeometryType.POLYGON]: LabelConverter
      });
    });
  });
});
