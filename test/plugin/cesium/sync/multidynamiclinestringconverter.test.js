goog.require('ol.geom.MultiLineString');
goog.require('ol.proj');
goog.require('ol.style.Style');
goog.require('os.feature.DynamicFeature');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.MultiDynamicLineStringConverter');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync.MultiDynamicLineStringConverter', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const MultiDynamicLineStringConverter = goog.module.get('plugin.cesium.sync.MultiDynamicLineStringConverter');
  const converter = new MultiDynamicLineStringConverter();

  let feature;
  let geometry;
  let style;
  let context;

  beforeEach(() => {
    geometry = new ol.geom.MultiLineString([[[0, 0], [2, 2]], [[4, 4], [6, 6]]]);
    feature = new os.feature.DynamicFeature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
  });

  const originalProjection = os.map.PROJECTION;
  afterEach(() => {
    os.map.PROJECTION = originalProjection;
  });

  const blue = 'rgba(0,0,255,1)';

  describe('create', () => {
    it('should create polylines', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      expect(context.polylines.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should update polylines', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      const primitives = converter.retrieve(feature, geometry, style, context);
      expect(context.polylines.length).toBe(2);

      style.setStroke(new ol.style.Stroke({
        color: blue,
        width: 2
      }));

      expect(converter.update(feature, geometry, style, context, primitives)).toBe(true);
      expect(context.polylines.length).toBe(2);
    });
  });
});
