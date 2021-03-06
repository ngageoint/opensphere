goog.module('test.plugin.cesium.scene');

const {getJulianDate} = goog.require('plugin.cesium');
const {fixContextLimits} = goog.require('test.plugin.cesium');


const getFakeScene = () => ({
  primitives: new Cesium.PrimitiveCollection(),
  groundPrimitives: new Cesium.PrimitiveCollection(),
  context: {
    cleanupPickIds: () => {}
  }
});

const getRealScene = () => {
  if (window.isWebGLMockEnabled) {
    if (!isWebGLMockEnabled()) {
      throw new Error('webgl-mock must be enabled before and disabled after this test: ' +
        'enableWebGLMock() and disableWebGLMock()');
    }
  } else {
    throw new Error('Please include webgl-mock.min.js in your tests. See ' +
      'opensphere/package.json:scripts.gen:webgl-mock for how that is built');
  }

  const creditContainer = document.createElement('div');
  const creditViewport = document.createElement('div');

  const canvas = new HTMLCanvasElement(500, 500);
  const scene = new Cesium.Scene({
    canvas: canvas,
    scene3DOnly: true,
    requestRenderMode: true,
    creditContainer,
    creditViewport
  });

  scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();

  fixContextLimits();
  return scene;
};

const renderScene = (scene) => {
  if (scene instanceof Cesium.Scene) {
    scene.initializeFrame();
    scene.forceRender(getJulianDate());
  } else {
    throw new Error('Only real Cesium scenes can be rendered. Did you mean to use getRealScene()?');
  }
};

for (const key in __karma__.files) {
  if (key.endsWith('/Cesium.js')) {
    window.CESIUM_BASE_URL = key.replace('/Cesium.js', '/');
    break;
  }
}

exports = {
  getFakeScene,
  getRealScene,
  renderScene
};
