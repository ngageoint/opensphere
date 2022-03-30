goog.require('os.feature.DynamicFeature');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.MultiDynamicLineStringConverter');
goog.require('test.plugin.cesium.scene');

import MultiLineString from 'ol/src/geom/MultiLineString.js';
import {get} from 'ol/src/proj.js';
import Stroke from 'ol/src/style/Stroke.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.MultiDynamicLineStringConverter', () => {
  const {default: DynamicFeature} = goog.module.get('os.feature.DynamicFeature');
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osMap = goog.module.get('os.map');
  const osProj = goog.module.get('os.proj');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: MultiDynamicLineStringConverter} =
    goog.module.get('plugin.cesium.sync.MultiDynamicLineStringConverter');
  const converter = new MultiDynamicLineStringConverter();

  let feature;
  let geometry;
  let style;
  let context;
  let layer;
  let scene;

  beforeEach(() => {
    geometry = new MultiLineString([[[0, 0], [2, 2]], [[4, 4], [6, 6]]]);
    feature = new DynamicFeature(geometry);
    style = new Style();
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  const originalProjection = osMap.PROJECTION;
  afterEach(() => {
    osMap.setProjection(originalProjection);
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

      style.setStroke(new Stroke({
        color: blue,
        width: 2
      }));

      expect(converter.update(feature, geometry, style, context, primitives)).toBe(true);
      expect(context.polylines.length).toBe(2);
    });
  });
});
