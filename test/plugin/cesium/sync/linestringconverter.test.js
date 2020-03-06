goog.require('ol.Feature');
goog.require('ol.geom.LineString');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('olcs.core');
goog.require('os.geom.GeometryField');
goog.require('os.interpolate');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.LineStringConverter');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.linestring');


describe('plugin.cesium.sync.LineStringConverter', () => {
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const {getLineRetriever, testLine} = goog.module.get('test.plugin.cesium.sync.linestring');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const LineStringConverter = goog.module.get('plugin.cesium.sync.LineStringConverter');
  const lineStringConverter = new LineStringConverter();

  let feature;
  let geometry;
  let style;
  let scene;
  let context;
  let getLine;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new ol.geom.LineString([[0, 0], [5, 5]]);
    feature = new ol.Feature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getRealScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
    getLine = getLineRetriever(context, scene);
  });

  const originalProjection = os.map.PROJECTION;
  afterEach(() => {
    disableWebGLMock();
    os.map.PROJECTION = originalProjection;
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
      style.setStroke(new ol.style.Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      testLine(getLine(), {color: green, width: 4});
    });

    it('should create a dashed line if the stroke contains a dash', () => {
      const stroke = new ol.style.Stroke({
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
        geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);

        style.setStroke(new ol.style.Stroke({
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
      feature.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.RHUMB);
      geometry.set('extrude', true);

      style.setStroke(new ol.style.Stroke({
        color: blue,
        width: 1
      }));

      style.setFill(new ol.style.Fill({
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
      feature.set(os.interpolate.METHOD_FIELD, os.interpolate.Method.RHUMB);
      geometry.set('extrude', true);
      geometry.set(os.data.RecordField.ALTITUDE_MODE, os.webgl.AltitudeMode.CLAMP_TO_GROUND);

      style.setStroke(new ol.style.Stroke({
        color: blue,
        width: 1
      }));

      style.setFill(new ol.style.Fill({
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
      style.setStroke(new ol.style.Stroke({
        color: blue,
        width: 3
      }));

      lineStringConverter.create(feature, geometry, style, context);

      const linestring = context.primitives.get(0);

      style.setStroke(new ol.style.Stroke({
        color: green,
        width: 4
      }));

      const result = lineStringConverter.update(feature, geometry, style, context, linestring);
      expect(result).toBe(false);
    });

    it('should not update changing dash patterns', () => {
      const stroke = new ol.style.Stroke({
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

    it('should update lines with new colors', () => {
      style.setStroke(new ol.style.Stroke({
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
