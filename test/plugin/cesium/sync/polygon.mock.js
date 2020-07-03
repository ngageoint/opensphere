goog.module('test.plugin.cesium.sync.polygon');

const {GeometryInstanceId} = goog.require('plugin.cesium');
const {testColor} = goog.require('test.plugin.cesium.sync.style');

const testPolygon = (polygon, options) => {
  options = options || {};
  options.primitiveClass = options.primitiveClass || Cesium.Primitive;
  options.geometryClass = options.geometryClass || Cesium.PolygonGeometry;

  expect(polygon.constructor).toBe(options.primitiveClass);

  if (!options.cleanedGeometryInstances) {
    expect(Array.isArray(polygon.geometryInstances)).toBe(false);
    expect(polygon.geometryInstances.id).toBe(plugin.cesium.GeometryInstanceId.GEOM);
    expect(polygon.geometryInstances.geometry.constructor).toBe(Cesium.PolygonGeometry);
  }

  if (options.color) {
    const expectedColor = Cesium.Color.fromCssColorString(options.color);
    let color;

    const material = polygon.appearance.material;
    if (material && material.uniforms) {
      color = material.uniforms.color;
    } else {
      const attributes = polygon.getGeometryInstanceAttributes(GeometryInstanceId.GEOM);
      color = attributes.color;
    }

    expect(color).toBeTruthy();
    testColor(color, expectedColor);
  }
};

exports = {
  testPolygon
};
