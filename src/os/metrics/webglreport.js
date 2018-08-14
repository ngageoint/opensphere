goog.provide('os.metrics.WebGLReport');

/**
 * @fileoverview This is a basic port of webglreport.js from webglreport by AGI
 */

/**
 * @license
 * Copyright 2011-2014 Analytical Graphics Inc. and Contributors
 *
 * The MIT License
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the 'Software'), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */


/**
 * @return {?Object.<string, *>} The report
 */
os.metrics.WebGLReport.getReport = function() {
  if (!os.metrics.WebGLReport.report_) {
    try {
      os.metrics.WebGLReport.report_ = os.metrics.WebGLReport.createReport_();
    } catch (e) {
      debugger;
    }
  }

  return os.metrics.WebGLReport.report_;
};


/**
 * @type {?Object.<string, *>}
 * @private
 */
os.metrics.WebGLReport.report_ = null;


/**
 * @return {Object.<string, *>} The report
 * @private
 */
os.metrics.WebGLReport.createReport_ = function() {
  var report = {
    'platform': navigator.platform,
    'userAgent': navigator.userAgent,
    'webglSupported': !!window.WebGLRenderingContext
  };

  if (!report['webglSupported']) {
    // The browser does not support WebGL;
    return report;
  }


  var canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  var body = document.getElementsByTagName('body')[0];
  body.appendChild(canvas);

  var contextName = '';
  var gl;
  var list = ['experimental-webgl2', 'webgl', 'experimental-webgl'];
  for (var i = 0; i < list.length; i++) {
    gl = canvas.getContext(list[i], {stencil: true});

    if (!!gl) {
      contextName = list[i];
      break;
    }
  }

  body.removeChild(canvas);

  if (!gl) {
    report['webglSupported'] = 'true, but init failed';
    return report;
  }

  function getExtensionUrl(extension) {
    // special cases
    if (extension === 'WEBKIT_lose_context') {
      extension = 'WEBGL_lose_context';
    }
    else if (extension === 'WEBKIT_WEBGL_compressed_textures') {
      extension = '';
    }
    extension = extension.replace(/^WEBKIT_/, '');
    extension = extension.replace(/^MOZ_/, '');
    extension = extension.replace(/_EXT_/, '_');

    return 'https://www.khronos.org/registry/webgl/extensions/' + extension;
  }

  function describeRange(value) {
    return '[' + value[0] + ', ' + value[1] + ']';
  }

  function getMaxAnisotropy() {
    var e = gl.getExtension('EXT_texture_filter_anisotropic') ||
        gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') ||
        gl.getExtension('MOZ_EXT_texture_filter_anisotropic');

    if (e) {
      var max = gl.getParameter(e.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      // See Canary bug: https://code.google.com/p/chromium/issues/detail?id=117450
      if (max === 0) {
        max = 2;
      }
      return max;
    }
    return null;
  }

  function formatPower(exponent, verbose) {
    if (verbose) {
      return '' + Math.pow(2, exponent);
    } else {
      return '2^' + exponent;
    }
  }

  function getPrecisionDescription(precision, verbose) {
    var verbosePart = verbose ? ' bit mantissa' : '';
    return '[-' + formatPower(precision.rangeMin, verbose) + ', ' +
        formatPower(precision.rangeMax, verbose) + '] (' + precision.precision + verbosePart + ')';
  }

  function getBestFloatPrecision(shaderType) {
    var high = gl.getShaderPrecisionFormat(shaderType, gl.HIGH_FLOAT);
    var medium = gl.getShaderPrecisionFormat(shaderType, gl.MEDIUM_FLOAT);

    var best = high;
    if (high.precision === 0) {
      best = medium;
    }

    return getPrecisionDescription(best, false);
  }

  function getFloatIntPrecision(gl) {
    var high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
    var s = (high.precision !== 0) ? 'highp/' : 'mediump/';

    high = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_INT);
    s += (high.rangeMax !== 0) ? 'highp' : 'lowp';

    return s;
  }

  function isPowerOfTwo(n) {
    return (n !== 0) && ((n & (n - 1)) === 0);
  }

  function getAngle(gl) {
    var lineWidthRange = describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));

    // Heuristic: ANGLE is only on Windows, not in IE, and does not implement line width greater than one.
    var angle = (navigator.platform === 'Win32') &&
        (gl.getParameter(gl.RENDERER) !== 'Internet Explorer') &&
        (lineWidthRange === describeRange([1, 1]));

    if (angle) {
      // Heuristic: D3D11 backend does not appear to reserve uniforms like the D3D9 backend, e.g.,
      // D3D11 may have 1024 uniforms per stage, but D3D9 has 254 and 221.
      //
      // We could also test for WEBGL_draw_buffers, but many systems do not have it yet
      // due to driver bugs, etc.
      if (isPowerOfTwo(gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS)) &&
          isPowerOfTwo(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS))) {
        return 'Yes, D3D11';
      } else {
        return 'Yes, D3D9';
      }
    }

    return 'No';
  }

  function getMajorPerformanceCaveat(contextName) {
    // Does context creation fail to do a major performance caveat?
    var canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    body.appendChild(canvas);

    var gl = canvas.getContext(contextName, {failIfMajorPerformanceCaveat: true });
    body.removeChild(canvas);

    if (!gl) {
      // Our original context creation passed.  This did not.
      return 'Yes';
    }

    if (typeof gl.getContextAttributes().failIfMajorPerformanceCaveat === 'undefined') {
      // If getContextAttributes() doesn't include the failIfMajorPerformanceCaveat
      // property, assume the browser doesn't implement it yet.
      return 'Not implemented';
    }

    return 'No';
  }

  function getMaxColorBuffers(gl) {
    var ext = gl.getExtension('WEBGL_draw_buffers');
    return ext ? gl.getParameter(ext.MAX_DRAW_BUFFERS_WEBGL) : 1;
  }

  function getUnmaskedInfo(gl) {
    var unMaskedInfo = {
      renderer: '',
      vendor: ''
    };

    var dbgRenderInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbgRenderInfo) {
      unMaskedInfo.renderer = gl.getParameter(dbgRenderInfo.UNMASKED_RENDERER_WEBGL);
      unMaskedInfo.vendor = gl.getParameter(dbgRenderInfo.UNMASKED_VENDOR_WEBGL);
    }

    return unMaskedInfo;
  }


  report['contextName'] = contextName;
  report['glVersion'] = gl.getParameter(gl.VERSION);
  report['shadingLanguageVersion'] = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
  report['vendor'] = gl.getParameter(gl.VENDOR);
  report['renderer'] = gl.getParameter(gl.RENDERER);
  report['unMaskedVendor'] = getUnmaskedInfo(gl).vendor;
  report['unMaskedRenderer'] = getUnmaskedInfo(gl).renderer;
  report['antialias'] = gl.getContextAttributes().antialias ? 'Available' : 'Not available';
  report['angle'] = getAngle(gl);
  report['majorPerformanceCaveat'] = getMajorPerformanceCaveat(contextName);
  report['maxColorBuffers'] = getMaxColorBuffers(gl);
  report['redBits'] = gl.getParameter(gl.RED_BITS);
  report['greenBits'] = gl.getParameter(gl.GREEN_BITS);
  report['blueBits'] = gl.getParameter(gl.BLUE_BITS);
  report['alphaBits'] = gl.getParameter(gl.ALPHA_BITS);
  report['depthBits'] = gl.getParameter(gl.DEPTH_BITS);
  report['stencilBits'] = gl.getParameter(gl.STENCIL_BITS);
  report['maxRenderBufferSize'] = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
  report['maxCombinedTextureImageUnits'] = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
  report['maxCubeMapTextureSize'] = gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE);
  report['maxFragmentUniformVectors'] = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
  report['maxTextureImageUnits'] = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
  report['maxTextureSize'] = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  report['maxVaryingVectors'] = gl.getParameter(gl.MAX_VARYING_VECTORS);
  report['maxVertexAttributes'] = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
  report['maxVertexTextureImageUnits'] = gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
  report['maxVertexUniformVectors'] = gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS);
  report['aliasedLineWidthRange'] = describeRange(gl.getParameter(gl.ALIASED_LINE_WIDTH_RANGE));
  report['aliasedPointSizeRange'] = describeRange(gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE));
  report['maxViewportDimensions'] = describeRange(gl.getParameter(gl.MAX_VIEWPORT_DIMS));
  report['maxAnisotropy'] = getMaxAnisotropy();
  report['extensions'] = gl.getSupportedExtensions();
  report['vertexShaderBestPrecision'] = getBestFloatPrecision(gl.VERTEX_SHADER);
  report['fragmentShaderBestPrecision'] = getBestFloatPrecision(gl.FRAGMENT_SHADER);
  report['fragmentShaderFloatIntPrecision'] = getFloatIntPrecision(gl);

  return report;
};
