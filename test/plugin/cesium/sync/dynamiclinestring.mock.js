goog.module('test.plugin.cesium.sync.dynamiclinestring');

const {testColor} = goog.require('test.plugin.cesium.sync.style');

const testLine = (line, options) => {
  options = options || {};
  options.color = options.color || 'rgba(0,0,0,0)';
  options.width = options.width == null ? 3 : options.width;
  options.primitiveClass = options.primitiveClass || Cesium.Polyline;

  expect(line.constructor).toBe(options.primitiveClass);

  const expectedMaterialType = options.dashPattern ? Cesium.Material.PolylineDashType : Cesium.Material.ColorType;
  expect(line.material.type).toBe(expectedMaterialType);

  const expectedColor = Cesium.Color.fromCssColorString(options.color);
  testColor(line.material.uniforms.color, expectedColor);

  expect(line.material.uniforms.dashLength).toBe(options.dashPattern ? 16 : undefined);
  expect(line.material.uniforms.dashPattern).toBe(options.dashPattern);

  expect(line.width).toBe(options.width);
};

exports = {
  testLine
};
