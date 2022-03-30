goog.require('os.geom.Ellipse');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.style.StyleField');
goog.require('os.style.StyleManager');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.EllipseConverter');
goog.require('test.plugin.cesium.scene');
goog.require('test.plugin.cesium.sync.linestring');

import Feature from 'ol/src/Feature.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.EllipseConverter', () => {
  const {default: Ellipse} = goog.module.get('os.geom.Ellipse');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {default: StyleField} = goog.module.get('os.style.StyleField');
  const {default: StyleManager} = goog.module.get('os.style.StyleManager');
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const {getLineRetriever, testLine} = goog.module.get('test.plugin.cesium.sync.linestring');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: EllipseConverter} = goog.module.get('plugin.cesium.sync.EllipseConverter');
  const ellipseConverter = new EllipseConverter();

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;
  let getLine;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new Ellipse([-5, -5], 100000, 50000, 45);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getRealScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
    getLine = getLineRetriever(context, scene);
  });

  afterEach(() => {
    disableWebGLMock();
  });


  describe('create', () => {
    it('should create an ellipse', () => {
      const result = ellipseConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      testLine(getLine());
    });

    it('should not create a ground reference for ellipses without altitude', () => {
      const config = StyleManager.getInstance().createLayerConfig(layer.getId());
      config[StyleField.SHOW_GROUND_REF] = true;
      const result = ellipseConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      expect(context.polylines.length).toBe(0);
    });

    it('should create a ground reference for ellipses with altitude', () => {
      geometry = new Ellipse([-5, -5, 1000], 100000, 50000, 45);
      const config = StyleManager.getInstance().createLayerConfig(layer.getId());
      config[StyleField.SHOW_GROUND_REF] = true;
      const result = ellipseConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      expect(context.polylines.length).toBe(1);
    });
  });

  describe('update', () => {
    it('should update an ellipse', () => {
      ellipseConverter.create(feature, geometry, style, context);
      expect(context.primitives.length).toBe(1);
      const polygonOutline = context.primitives.get(0);

      polygonOutline.dirty = true;
      const result = ellipseConverter.update(feature, geometry, style, context, polygonOutline);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      expect(context.primitives.get(0)).toBe(polygonOutline);
      expect(polygonOutline.dirty).toBe(false);
    });

    it('should not update a ground reference for ellipses without altitude', () => {
      const config = StyleManager.getInstance().createLayerConfig(layer.getId());
      config[StyleField.SHOW_GROUND_REF] = true;
      ellipseConverter.create(feature, geometry, style, context);

      geometry.setCenter([0, 0]);
      geometry.interpolateEllipse();

      const result = ellipseConverter.update(feature, geometry, style, context, context.primitives.get(0));
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      expect(context.polylines.length).toBe(0);
    });

    it('should create a ground reference for ellipses with altitude', () => {
      geometry = new Ellipse([-5, -5, 1000], 100000, 50000, 45);
      const config = StyleManager.getInstance().createLayerConfig(layer.getId());
      config[StyleField.SHOW_GROUND_REF] = true;
      ellipseConverter.create(feature, geometry, style, context);

      geometry.setCenter([0, 0, 1000]);
      geometry.interpolateEllipse();

      const result = ellipseConverter.update(feature, geometry, style, context, context.primitives.get(0));
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(1);
      expect(context.polylines.length).toBe(1);
    });
  });
});
