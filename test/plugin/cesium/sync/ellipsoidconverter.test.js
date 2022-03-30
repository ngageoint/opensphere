goog.require('os.geom.Ellipse');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.style.StyleField');
goog.require('os.style.StyleManager');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.EllipsoidConverter');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.EllipsoidConverter', () => {
  const {default: Ellipse} = goog.module.get('os.geom.Ellipse');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: EllipsoidConverter} = goog.module.get('plugin.cesium.sync.EllipsoidConverter');
  const ellipsoidConverter = new EllipsoidConverter();

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new Ellipse([-5, -5], 100000, 50000, 45);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getRealScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  afterEach(() => {
    disableWebGLMock();
  });

  describe('create', () => {
    it('should create an ellipsoid', () => {
      const result = ellipsoidConverter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(context.primitives.length).toBe(2);
    });
  });
});
