goog.require('ol.geom.MultiPolygon');
goog.require('ol.proj');
goog.require('ol.style.Style');
goog.require('os.feature.DynamicFeature');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.DynamicMultiPolygonConverter');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync.DynamicMultiPolygonConverter', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const DynamicMultiPolygonConverter = goog.module.get('plugin.cesium.sync.DynamicMultiPolygonConverter');
  const converter = new DynamicMultiPolygonConverter();

  let feature;
  let geometry;
  let style;
  let context;

  beforeEach(() => {
    const coords = [
      [
        [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]]
      ],
      [
        [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]]
      ]
    ];
    geometry = new ol.geom.MultiPolygon(coords);
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
    it('should create multipolygons', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      expect(context.polylines.length).toBe(2);
    });

    it('should create multipolygons with holes', () => {
      const coords = [
        [
          [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]],
          [[1, 1], [1, 4], [4, 4], [4, 1], [1, 1]]
        ],
        [
          [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]],
          [[12, 12], [12, 18], [18, 18], [18, 12], [12, 12]]
        ]
      ];
      geometry = new ol.geom.MultiPolygon(coords);
      feature = new os.feature.DynamicFeature(geometry);

      expect(converter.create(feature, geometry, style, context)).toBe(true);
      expect(context.polylines.length).toBe(4);
    });
  });

  describe('update', () => {
    it('should update multipolygons', () => {
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
