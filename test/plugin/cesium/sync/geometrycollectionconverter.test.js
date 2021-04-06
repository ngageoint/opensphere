goog.require('ol.Feature');
goog.require('ol.geom.GeometryCollection');
goog.require('ol.geom.Point');
goog.require('ol.geom.Polygon');
goog.require('ol.proj');
goog.require('ol.style.Fill');
goog.require('ol.style.Style');
goog.require('olcs.core');
goog.require('os.layer.Vector');
goog.require('os.map');
goog.require('os.proj');
goog.require('os.webgl.AltitudeMode');
goog.require('plugin.cesium.VectorContext');
goog.require('plugin.cesium.sync.GeometryCollectionConverter');
goog.require('test.plugin.cesium.scene');

describe('plugin.cesium.sync.GeometryCollectionConverter', () => {
  const {getFakeScene} = goog.module.get('test.plugin.cesium.scene');
  const VectorContext = goog.module.get('plugin.cesium.VectorContext');
  const GeometryCollectionConverter = goog.module.get('plugin.cesium.sync.GeometryCollectionConverter');
  const converter = new GeometryCollectionConverter();

  let feature;
  let geometry;
  let style;
  let layer;
  let scene;
  let context;

  const mockConvert = (feature, geometry) => {
    geometry.processed = true;
  };

  beforeEach(() => {
    geometry = new ol.geom.GeometryCollection();
    feature = new ol.Feature(geometry);
    style = new ol.style.Style();
    layer = new os.layer.Vector();
    scene = getFakeScene();
    context = new VectorContext(scene, layer, ol.proj.get(os.proj.EPSG4326));
  });

  describe('create', () => {
    it('should not run without a convert function', () => {
      expect(converter.create(feature, geometry, style, context)).toBe(false);
    });

    it('should not run without geometries', () => {
      const result = converter.create(feature, geometry, style, context);
      expect(result).toBe(false);
      expect(geometry.processed).toBe(undefined);
    });

    it('should recursively create geometries', () => {
      const point = new ol.geom.Point([0, 0]);
      const poly = new ol.geom.Polygon.fromExtent([-5, -5, 5, 5]);
      const geoms = [point, poly];
      geometry.setGeometriesArray(geoms);

      GeometryCollectionConverter.setConvertFunction(mockConvert);

      const result = converter.create(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(point.processed).toBe(true);
      expect(poly.processed).toBe(true);
    });
  });

  describe('update', () => {
    it('should not run without a convert function', () => {
      expect(converter.update(feature, geometry, style, context)).toBe(false);
    });

    it('should recursively update geometries', () => {
      const point = new ol.geom.Point([0, 0]);
      const poly = new ol.geom.Polygon.fromExtent([-5, -5, 5, 5]);
      const geoms = [point, poly];
      geometry.setGeometriesArray(geoms);
      GeometryCollectionConverter.setConvertFunction(mockConvert);

      const result = converter.update(feature, geometry, style, context);
      expect(result).toBe(true);
      expect(point.processed).toBe(true);
      expect(poly.processed).toBe(true);
    });
  });
});
