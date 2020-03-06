goog.module('test.plugin.cesium.sync.linestring');

const {GeometryInstanceId} = goog.require('plugin.cesium');
const {testColor} = goog.require('test.plugin.cesium.sync.style');
const {renderScene} = goog.require('test.plugin.cesium.scene');

const testLine = (line, options) => {
  options = options || {};
  options.color = options.color || 'rgba(0,0,0,0)';
  options.width = options.width == null ? 3 : options.width;
  options.extrude = options.extrude || false;
  options.primitiveClass = options.primitiveClass || Cesium.Primitive;
  options.geometryClass = options.geometryClass || Cesium.PolylineGeometry;

  expect(line.constructor).toBe(options.primitiveClass);

  waitsFor(() => line.ready, 'line to become ready');

  line.readyPromise.then(() => {
    expect(line.ready).toBe(true);

    expect(Array.isArray(line.geometryInstances)).toBe(false);
    expect(line.geometryInstances.geometry.constructor).toBe(options.geometryClass);

    const expectedColor = Cesium.Color.fromCssColorString(options.color);

    if (options.geometryClass === Cesium.PolylineGeometry || options.geometryClass === Cesium.GroundPolylineGeometry) {
      expect(line.geometryInstances.id).toBe(plugin.cesium.GeometryInstanceId.GEOM_OUTLINE);
      if (options.dashPattern) {
        expect(line.appearance.constructor).toBe(Cesium.PolylineMaterialAppearance);
        expect(line.appearance.material.type).toBe(Cesium.Material.PolylineDashType);
        testColor(line.appearance.material.uniforms.color, expectedColor);
        expect(line.appearance.material.uniforms.dashLength).toBe(16);
        expect(line.appearance.material.uniforms.dashPattern).toBe(options.dashPattern);
      } else {
        expect(line.appearance.constructor).toBe(Cesium.PolylineColorAppearance);
        const attributes = line.getGeometryInstanceAttributes(GeometryInstanceId.GEOM_OUTLINE);
        expect(attributes).toBeTruthy();
        testColor(attributes.color, expectedColor);
      }
    } else {
      expect(line.appearance.constructor).toBe(Cesium.PerInstanceColorAppearance);
      expect(line.geometryInstances.id).toBe(GeometryInstanceId.GEOM);
      const attributes = line.getGeometryInstanceAttributes(GeometryInstanceId.GEOM);
      expect(attributes).toBeTruthy();
      testColor(attributes.color, expectedColor);
    }

    expect(line.olLineWidth).toBe(options.width);
  });
};

const getLineRetriever = (context, scene) => (opt_collection, opt_index) => {
  opt_collection = opt_collection || context.primitives;
  opt_index = opt_index != null ? opt_index : 0;
  const line = opt_collection.get(opt_index);

  line._asynchronous = false;
  line._releaseGeometryInstances = false;

  if (line._primitiveOptions) {
    line._primitiveOptions.asynchronous = false;
    line._primitiveOptions.releaseGeometryInstances = false;
  }

  renderScene(scene);
  return line;
};

exports = {
  getLineRetriever,
  testLine
};
