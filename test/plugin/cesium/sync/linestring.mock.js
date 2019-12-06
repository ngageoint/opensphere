goog.module('test.plugin.cesium.sync.linestring');

const {testColor} = goog.require('test.plugin.cesium.sync.style');

const testLine = (line, options) => {
  options = options || {};
  options.color = options.color || 'rgba(0,0,0,0)';
  options.width = options.width == null ? 3 : options.width;
  options.primitiveClass = options.primitiveClass || Cesium.Primitive;
  options.geometryClass = options.geometryClass || Cesium.PolylineGeometry;

  expect(line.constructor).toBe(options.primitiveClass);

  if (!options.cleanedGeometryInstances) {
    expect(Array.isArray(line.geometryInstances)).toBe(false);
    expect(line.geometryInstances.geometry.constructor).toBe(options.geometryClass);
    expect(line.geometryInstances.id).toBe(plugin.cesium.GeometryInstanceId.GEOM_OUTLINE);
  }

  expect(line.appearance.material.type).toBe(Cesium.Material.PolylineDashType);

  const expectedColor = Cesium.Color.fromCssColorString(options.color);
  testColor(line.appearance.material.uniforms.color, expectedColor);

  expect(line.appearance.material.uniforms.dashLength).toBe(16);
  expect(line.appearance.material.uniforms.dashPattern).toBe(options.dashPattern);

  expect(line.olLineWidth).toBe(options.width);
};

exports = {
  testLine
};
