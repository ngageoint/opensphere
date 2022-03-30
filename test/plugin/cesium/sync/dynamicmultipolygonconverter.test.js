goog.require('os.feature.DynamicFeature');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.DynamicMultiPolygonConverter');
goog.require('test.plugin.cesium.scene');

import MultiPolygon from 'ol/src/geom/MultiPolygon.js';
import {get} from 'ol/src/proj.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.DynamicMultiPolygonConverter', () => {
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const {default: Vector} = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const {EPSG4326} = goog.module.get('os.proj');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: DynamicMultiPolygonConverter} = goog.module.get('plugin.cesium.sync.DynamicMultiPolygonConverter');

  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');

  const converter = new DynamicMultiPolygonConverter();

  let feature;
  let geometry;
  let style;
  let context;
  let layer;
  let scene;

  beforeEach(() => {
    const coords = [
      [
        [[0, 0], [0, 5], [5, 5], [5, 0], [0, 0]]
      ],
      [
        [[10, 10], [10, 20], [20, 20], [20, 10], [10, 10]]
      ]
    ];
    geometry = new MultiPolygon(coords);
    feature = new DynamicFeature(geometry);
    style = new Style();
    layer = new Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(EPSG4326));
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    osMap.setProjection(originalProjection);
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
      geometry = new MultiPolygon(coords);
      feature = new DynamicFeature(geometry);

      expect(converter.create(feature, geometry, style, context)).toBe(true);
      expect(context.polylines.length).toBe(4);
    });
  });

  describe('update', () => {
    it('should update multipolygons', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(true);
      const primitives = converter.retrieve(feature, geometry, style, context);
      expect(context.polylines.length).toBe(2);

      style.setStroke(new Stroke({
        color: blue,
        width: 2
      }));

      expect(converter.update(feature, geometry, style, context, primitives)).toBe(true);
      expect(context.polylines.length).toBe(2);
    });
  });
});
