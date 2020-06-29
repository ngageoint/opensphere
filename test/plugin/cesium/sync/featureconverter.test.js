goog.require('ol.Feature');
goog.require('ol.geom.Point');
goog.require('ol.style.Style');
goog.require('os.layer.Vector');
goog.require('os.proj');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.convert');
goog.require('plugin.cesium.sync.converter');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync.convert', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const converterExports = goog.module.get('plugin.cesium.sync.converter');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const convert = goog.module.get('plugin.cesium.sync.convert');

  let feature;
  let geometry;
  let layer;
  let scene;
  let context;

  beforeEach(() => {
    geometry = new ol.geom.Polygon.fromExtent([-5, -5, 5, 5]);
    feature = new ol.Feature(geometry);
    layer = new os.layer.Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
  });

  it('should not convert empty styles', () => {
    spyOn(converterExports, 'convertGeometry').andReturn(undefined);
    feature.setStyle(null);
    layer.setStyle(null);
    convert(feature, 1, context);
    expect(converterExports.convertGeometry).not.toHaveBeenCalled();
  });

  it('should fall back on layer styles', () => {
    spyOn(converterExports, 'convertGeometry').andReturn(undefined);
    layer.setStyle(new ol.style.Style());
    convert(feature, 1, context);
    expect(converterExports.convertGeometry.calls.length).toBe(1);
  });

  it('should convert each style on the feature', () => {
    spyOn(converterExports, 'convertGeometry').andReturn(undefined);
    feature.setStyle([
      new ol.style.Style(),
      null,
      new ol.style.Style()
    ]);

    convert(feature, 1, context);
    expect(converterExports.convertGeometry.calls.length).toBe(2);
  });

  it('should not convert styles without geometries', () => {
    spyOn(converterExports, 'convertGeometry').andReturn(undefined);

    const missingGeomStyle = new ol.style.Style();
    missingGeomStyle.setGeometry(() => null);

    feature.setStyle([
      missingGeomStyle,
      undefined,
      new ol.style.Style()
    ]);

    convert(feature, 1, context);
    expect(converterExports.convertGeometry.calls.length).toBe(1);
  });

  it('should handle non-array styles', () => {
    spyOn(converterExports, 'convertGeometry').andReturn(undefined);
    feature.setStyle(() => new ol.style.Style());
    convert(feature, 1, context);
    expect(converterExports.convertGeometry.calls.length).toBe(1);
  });
});
