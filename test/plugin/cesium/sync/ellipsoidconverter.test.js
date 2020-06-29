goog.require('ol.Feature');
goog.require('ol.proj');
goog.require('os.geom.Ellipse');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.style.StyleField');
goog.require('os.style.StyleManager');
goog.require('plugin.cesium');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.EllipsoidConverter');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync.EllipsoidConverter', () => {
  const {getRealScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const EllipsoidConverter = goog.module.get('plugin.cesium.sync.EllipsoidConverter');
  const ellipsoidConverter = new EllipsoidConverter();

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    enableWebGLMock();
    geometry = new os.geom.Ellipse([-5, -5], 100000, 50000, 45);
    feature = new ol.Feature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getRealScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
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
