goog.require('ol.Feature');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('olcs.core');
goog.require('os.interpolate');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.PolygonConverter');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.linestring');
goog.require('test.plugin.cesium.sync.polygon');


describe('plugin.cesium.sync.PolygonConverter', () => {
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const {getLineRetriever, testLine} = goog.module.get('test.plugin.cesium.sync.linestring');
  const {testPolygon} = goog.module.get('test.plugin.cesium.sync.polygon');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const PolygonConverter = goog.module.get('plugin.cesium.sync.PolygonConverter');
  const polygonConverter = new PolygonConverter();

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;
  let getLine;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new ol.geom.Polygon.fromExtent([-5, -5, 5, 5]);
    feature = new ol.Feature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getRealScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
    getLine = getLineRetriever(context, scene);
  });

  afterEach(() => {
    disableWebGLMock();
  });

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';

  describe('create', () => {
    it('should create a polygon', () => {
      const result = polygonConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      testLine(getLine());
    });

    it('should create an outline with a given stroke style', () => {
      style.setStroke(new ol.style.Stroke({
        color: green,
        width: 4
      }));

      const result = polygonConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      testLine(getLine(), {
        color: green,
        width: 4
      });
    });

    it('should create a dashed line if the stroke contains a dash', () => {
      const stroke = new ol.style.Stroke({
        color: green,
        width: 1
      });
      stroke.setLineDash([12, 4]);
      style.setStroke(stroke);

      const result = polygonConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      testLine(getLine(), {
        color: green,
        width: 1,
        dashPattern: parseInt('1111111111110000', 2)
      });
    });

    it('should create an outline for every ring of the polygon', () => {
      const otherRing = ol.geom.Polygon.fromExtent([-2, -2, 2, 2]);
      const coords = geometry.getCoordinates();
      coords.push(otherRing.getCoordinates()[0]);
      geometry.setCoordinates(coords);

      const result = polygonConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      expect(context.primitives.length).toBe(2);

      for (let i = 0, n = context.primitives.length; i < n; i++) {
        testLine(getLine(context.primitives, i));
      }
    });

    it('should create a single fill if one exists on the style', () => {
      style.setStroke(new ol.style.Stroke({
        color: green,
        width: 4
      }));

      style.setFill(new ol.style.Fill({
        color: blue
      }));

      const result = polygonConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);

      expect(context.primitives.length).toBe(2);
      const polygonFill = context.primitives.get(1);
      polygonFill._asynchronous = false;
      polygonFill._releaseGeometryInstances = false;

      // getLine calls renderScene()
      testLine(getLine(), {
        color: green,
        width: 4
      });

      expect(polygonFill.ready).toBe(true);
      testPolygon(polygonFill, {
        color: blue
      });
    });
  });
});
