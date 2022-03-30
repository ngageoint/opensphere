goog.require('os.data.RecordField');
goog.require('os.geom.GeometryField');
goog.require('os.interpolate');
goog.require('os.interpolate.Method');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.LineStringConverter');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.linestring');

import Feature from 'ol/src/Feature.js';
import LineString from 'ol/src/geom/LineString.js';
import {get} from 'ol/src/proj.js';
import Fill from 'ol/src/style/Fill.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.LineStringConverter', () => {
  const {default: RecordField} = goog.module.get('os.data.RecordField');
  const interpolate = goog.module.get('os.interpolate');
  const {default: Method} = goog.module.get('os.interpolate.Method');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');
  const {default: AltitudeMode} = goog.module.get('os.webgl.AltitudeMode');
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const {getLineRetriever, testLine} = goog.module.get('test.plugin.cesium.sync.linestring');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: LineStringConverter} = goog.module.get('plugin.cesium.sync.LineStringConverter');
  const lineStringConverter = new LineStringConverter();

  let feature;
  let geometry;
  let style;
  let scene;
  let context;
  let getLine;
  let layer;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new LineString([[0, 0], [5, 5]]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getRealScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
    getLine = getLineRetriever(context, scene);
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    disableWebGLMock();
    osMap.setProjection(originalProjection);
  });

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';


  describe('create', () => {
    it('should create a line', () => {
      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      testLine(getLine());
    });

    it('should create a line with a given stroke style', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(getLine(), {color: green, width: 4});
    });

    it('should create a dashed line if the stroke contains a dash', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([12, 4]);
      style.setStroke(stroke);

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(getLine(), {
        color: green,
        dashPattern: parseInt('1111111111110000', 2),
        width: 1
      });
    });

    it('should use the correct classes when the altitude mode is clampToGround', () => {
      let initialized = false;
      Cesium.GroundPolylinePrimitive.initializeTerrainHeights().then(() => initialized = true);
      waitsFor(() => initialized, 'terrain heights to initialize');

      runs(() => {
        geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);

        style.setStroke(new Stroke({
          color: green,
          width: 1
        }));

        const result = lineStringConverter.create(feature, geometry, style, context);
        expect(result).toBe(true);
        expect(context.groundPrimitives.length).toBe(1);
        testLine(getLine(context.groundPrimitives), {
          color: green,
          width: 1,
          primitiveClass: Cesium.GroundPolylinePrimitive,
          geometryClass: Cesium.GroundPolylineGeometry
        });
      });
    });

    it('should use WallGeometry when extrude is set', () => {
      feature.set(interpolate.METHOD_FIELD, Method.RHUMB);
      geometry.set('extrude', true);

      style.setStroke(new Stroke({
        color: blue,
        width: 1
      }));

      style.setFill(new Fill({
        color: green
      }));

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(getLine(context.primitives), {
        color: green,
        width: 1,
        geometryClass: Cesium.WallGeometry
      });
    });

    it('should prefer extrusion to clampToGround', () => {
      feature.set(interpolate.METHOD_FIELD, Method.RHUMB);
      geometry.set('extrude', true);
      geometry.set(RecordField.ALTITUDE_MODE, AltitudeMode.CLAMP_TO_GROUND);

      style.setStroke(new Stroke({
        color: blue,
        width: 1
      }));

      style.setFill(new Fill({
        color: green
      }));

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      expect(context.primitives.length).toBe(1);

      testLine(getLine(), {
        color: green,
        width: 1,
        geometryClass: Cesium.WallGeometry
      });
    });
  });

  describe('update', () => {
    it('should not update changing line widths', () => {
      style.setStroke(new Stroke({
        color: blue,
        width: 3
      }));

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.primitives.get(0);

      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(false);
    });

    it('should not update changing dash patterns', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([12, 4]);
      style.setStroke(stroke);

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.primitives.get(0);
      stroke.setLineDash([8, 8]);

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(false);
    });

    it('should not update if adding a dash pattern', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      style.setStroke(stroke);

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.primitives.get(0);
      stroke.setLineDash([8, 8]);

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(false);
    });

    it('should not update if removing a dash pattern', () => {
      const stroke = new Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([8, 8]);
      style.setStroke(stroke);

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.primitives.get(0);
      stroke.setLineDash(null);
      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(false);
    });

    it('should update lines with new colors', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 4
      }));

      let result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      const linestring = getLine();
      expect(linestring.ready).toBe(true);

      testLine(linestring, {
        color: green,
        width: 4
      });

      style.getStroke().setColor(blue);

      linestring.dirty = true;
      result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(true);

      testLine(linestring, {
        color: blue,
        width: 4
      });

      expect(linestring.dirty).toBe(false);
    });
  });
});
