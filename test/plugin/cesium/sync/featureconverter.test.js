goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.convert');
goog.require('test.plugin.cesium.scene');

import Feature from 'ol/src/Feature.js';
import {fromExtent} from 'ol/src/geom/Polygon.js';
import {get} from 'ol/src/proj.js';
import Style from 'ol/src/style/Style.js';

describe('plugin.cesium.sync.convert', () => {
  const {default: VectorLayer} = goog.module.get('os.layer.Vector');
  const osProj = goog.module.get('os.proj');
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const {default: VectorContext} = goog.module.get('plugin.cesium.VectorContext');
  const {default: convert} = goog.module.get('plugin.cesium.sync.convert');

  let feature;
  let geometry;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    geometry = new fromExtent([-5, -5, 5, 5]);
    feature = new Feature(geometry);
    layer = new VectorLayer();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, get(osProj.EPSG4326));
  });

  it('should not convert empty styles', () => {
    feature.setStyle(null);
    layer.setStyle(null);
    convert(feature, 1, context);
    expect(context.primitives.length).toBe(0);
  });

  it('should fall back on layer styles', () => {
    layer.setStyle(new Style());
    convert(feature, 1, context);
    expect(context.primitives.length).toBe(1);
  });

  it('should convert each style on the feature', () => {
    feature.setStyle([
      new Style(),
      null,
      new Style({geometry: new fromExtent([-5, -5, 5, 5])})
    ]);

    convert(feature, 1, context);
    expect(context.primitives.length).toBe(2);
  });

  it('should not convert styles without geometries', () => {
    const missingGeomStyle = new Style();
    missingGeomStyle.setGeometry(() => null);

    feature.setStyle([
      missingGeomStyle,
      undefined,
      new Style()
    ]);

    convert(feature, 1, context);
    expect(context.primitives.length).toBe(1);
  });

  it('should handle non-array styles', () => {
    feature.setStyle(() => new Style());
    convert(feature, 1, context);
    expect(context.primitives.length).toBe(1);
  });
});
