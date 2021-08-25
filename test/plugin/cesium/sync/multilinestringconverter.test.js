goog.require('ol.Feature');
goog.require('ol.geom.MultiLineString');
goog.require('ol.proj');
goog.require('ol.style.Stroke');
goog.require('ol.style.Style');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.style');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.MultiLineStringConverter');
goog.require('test.plugin.cesium.scene');


describe('plugin.cesium.sync.MultiLineStringConverter', () => {
  const Feature = goog.module.get('ol.Feature');
  const MultiLineString = goog.module.get('ol.geom.MultiLineString');
  const olProj = goog.module.get('ol.proj');
  const Stroke = goog.module.get('ol.style.Stroke');
  const Style = goog.module.get('ol.style.Style');
  const VectorLayer = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');
  const osStyle = goog.module.get('os.style');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const MultiLineStringConverter = goog.module.get('plugin.cesium.sync.MultiLineStringConverter');
  const converter = new MultiLineStringConverter();

  let feature;
  let geometry;
  let style;
  let context;

  beforeEach(() => {
    geometry = new MultiLineString([[[0, 0], [2, 2]], [[4, 4], [6, 6]]]);
    feature = new Feature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, olProj.get(osProj.EPSG4326));
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    osMap.setProjection(originalProjection);
  });

  const blue = 'rgba(0,0,255,1)';
  const green = 'rgba(0,255,0,1)';

  describe('create', () => {
    it('should create polylines', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      expect(context.primitives.length).toBe(2);
    });
  });

  describe('update', () => {
    it('should not update if the line width is changing', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 2
      }));

      expect(converter.create(feature, geometry, style, context)).toBe(true);
      const primitives = converter.retrieve(feature, geometry, style, context);

      style.setStroke(new Stroke({
        color: blue,
        width: 3
      }));

      expect(converter.update(feature, geometry, style, context, primitives)).toBe(false);
    });

    it('should not update if the line dash style is changing', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      const primitives = converter.retrieve(feature, geometry, style, context);

      style.setStroke(new Stroke({
        lineDash: osStyle.LINE_STYLE_OPTIONS[1].pattern,
        color: blue,
        width: 3
      }));

      expect(converter.update(feature, geometry, style, context, primitives)).toBe(false);
    });

    it('should update polylines', () => {
      style.setStroke(new Stroke({
        color: green,
        width: 2
      }));

      expect(converter.create(feature, geometry, style, context)).toBe(true);
      const primitives = converter.retrieve(feature, geometry, style, context);
      expect(context.primitives.length).toBe(2);

      style.setStroke(new Stroke({
        color: blue,
        width: 2
      }));

      primitives.forEach((p) => p.dirty = true);
      expect(converter.update(feature, geometry, style, context, primitives)).toBe(true);
      expect(context.primitives.length).toBe(2);
      primitives.forEach((p) => expect(p.dirty).toBe(false));
    });
  });
});
