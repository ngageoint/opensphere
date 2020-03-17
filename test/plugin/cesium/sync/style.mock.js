goog.module('test.plugin.cesium.sync.style');

const testColor = (color, expectedColor) => {
  color = normalizeColor(color);
  expectedColor = normalizeColor(expectedColor);

  expect(color.red).toBeCloseTo(expectedColor.red, 12);
  expect(color.green).toBeCloseTo(expectedColor.green, 12);
  expect(color.blue).toBeCloseTo(expectedColor.blue, 12);
  expect(color.alpha).toBeCloseTo(expectedColor.alpha, 12);
};

const normalizeColor = (color) => {
  if (!(color instanceof Cesium.Color)) {
    if (Array.isArray(color) || color instanceof Uint8Array) {
      return Cesium.Color.fromBytes.apply(null, color);
    } else if (typeof color === 'string') {
      return Cesium.Color.fromCssColorString(color);
    }
  }

  return color;
};

exports = {
  testColor
};
