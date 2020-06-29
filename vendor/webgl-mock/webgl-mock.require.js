const emptyFn = function() {};

const originals = {
  HTMLCanvasElement,
  CanvasRenderingContext2D,
  ImageData,
  Image,
  HTMLImageElement,
  HTMLVideoElement,

  WebGLRenderingContext,
  WebGLActiveInfo,
  WebGLBuffer,
  WebGLContextEvent,
  WebGLFramebuffer,
  WebGLQuery,
  WebGLShader,
  WebGLShaderPrecisionFormat,
  WebGLTexture,
  WebGLUniformLocation
};

const mocks = {
  // canvas
  HTMLCanvasElement: require('webgl-mock/src/HTMLCanvasElement'),
  CanvasRenderingContext2D: require('webgl-mock/src/CanvasRenderingContext2D'),
  ImageData: require('webgl-mock/src/ImageData'),
  Image: require('webgl-mock/src/Image'),
  HTMLImageElement: global.Image,
  HTMLVideoElement: global.Image,

  // WebGL 1.0
  WebGLRenderingContext: require('webgl-mock/src/WebGLRenderingContext'),
  WebGLActiveInfo: emptyFn,
  WebGLBuffer: emptyFn,
  WebGLContextEvent: emptyFn,
  WebGLFramebuffer: emptyFn,
  WebGLProgram: emptyFn,
  WebGLQuery: emptyFn,
  WebGLRenderbuffer: emptyFn,
  WebGLShader: emptyFn,
  WebGLShaderPrecisionFormat: emptyFn,
  WebGLTexture: emptyFn,
  WebGLUniformLocation: emptyFn
};

mocks.HTMLCanvasElement.prototype.addEventListener = emptyFn;
mocks.HTMLCanvasElement.prototype.removeEventListener = emptyFn;

// webgl-mock has this return {} for every extension, which is not very
// useful when you are checking if the extension exists in order to
// subsequently use it. Instead, pretend we don't have any.
mocks.WebGLRenderingContext.prototype.getExtension = emptyFn;

global.enableWebGLMock = () => {
  Object.assign(global, mocks);
};

global.isWebGLMockEnabled = () => {
  return global.HTMLCanvasElement === mocks.HTMLCanvasElement;
};

global.disableWebGLMock = () => {
  Object.assign(global, originals);
};

