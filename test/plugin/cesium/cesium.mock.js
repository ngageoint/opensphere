goog.module('test.plugin.cesium');

const fixContextLimits = () => {
  // pretend WebGL is available
  Object.assign(Cesium.ContextLimits,
      {
        '_maximumCombinedTextureImageUnits': 80,
        '_maximumCubeMapSize': 16384,
        '_maximumFragmentUniformVectors': 1024,
        '_maximumTextureImageUnits': 16,
        '_maximumRenderbufferSize': 16384,
        '_maximumTextureSize': 16384,
        '_maximumVaryingVectors': 32,
        '_maximumVertexAttributes': 16,
        '_maximumVertexTextureImageUnits': 16,
        '_maximumVertexUniformVectors': 1024,
        '_minimumAliasedLineWidth': 1,
        '_maximumAliasedLineWidth': 1,
        '_minimumAliasedPointSize': 1,
        '_maximumAliasedPointSize': 8191,
        '_maximumViewportWidth': 16384,
        '_maximumViewportHeight': 16384,
        '_maximumTextureFilterAnisotropy': 16,
        '_maximumDrawBuffers': 8,
        '_maximumColorAttachments': 8,
        '_highpFloatSupported': true,
        '_highpIntSupported': true
      });
};

fixContextLimits();

exports = {
  fixContextLimits
};
