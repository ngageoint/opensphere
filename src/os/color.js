/**
 * Namespace for color utilities.
 */
goog.module('os.color');
goog.module.declareLegacyNamespace();

goog.require('goog.array');
goog.require('goog.color');
goog.require('goog.color.Rgb');
goog.require('goog.math');
goog.require('goog.math.Matrix');


/**
 * @typedef {{
 *   alpha: number,
 *   color: goog.color.Rgb,
 *   ratio: number
 * }}
 */
let GradientColor;


/**
 * Regular expression to detect hex color strings. Supports arbitrary whitespace before/after the string, but not in
 * the middle of the string.
 * @type {RegExp}
 */
const HEX_REGEX = /^\s*(0x|#)?[0-9a-f]{2,6}\s*$/i;


/**
 * Regular expression to detect RGBA color strings. Supports arbitrary whitespace between parts and decimal opacity.
 * @type {RegExp}
 */
const RGBA_REGEX = /rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*\d?(\.\d+)?)?\s*\)/i;


/**
 * Regex for capturing the components of an rgb/rgba color string.
 * @type {RegExp}
 */
const RGBA_MATCH_REGEX = /\s*rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d?(\.\d+)?)\s*)?\)/i;


/**
 * @type {Array<GradientColor>}
 */
const COLOR_WHEEL = [
  {
    alpha: 1.0,
    color: [255, 0, 255],
    ratio: 0
  }, {
    alpha: 1.0,
    color: [0, 0, 255],
    ratio: 51
  }, {
    alpha: 1.0,
    color: [0, 255, 255],
    ratio: 102
  }, {
    alpha: 1.0,
    color: [0, 255, 0],
    ratio: 153
  }, {
    alpha: 1.0,
    color: [255, 255, 0],
    ratio: 204
  }, {
    alpha: 1.0,
    color: [255, 0, 0],
    ratio: 255
  }
];


/**
 * @type {Array<GradientColor>}
 */
const DEFAULT_GRADIENT = [
  {
    alpha: 1.0,
    color: [255, 136, 0], // orange 000000 FFCC00
    ratio: 0
  }, {
    alpha: 1.0,
    color: [255, 255, 0], // yellow FFCC00 CCFF00
    ratio: 43 // 6
  }, {
    alpha: 1.0,
    color: [0, 255, 0], // green CCFF00 00FFCC
    ratio: 85 // 6
  }, {
    alpha: 1.0,
    color: [0, 255, 255], // light blue 00FFCC 00CCFF
    ratio: 128 // 6
  }, {
    alpha: 1.0,
    color: [0, 0, 255], // blue 00CCFF  6600CC
    ratio: 170 // 6
  }, {
    alpha: 1.0,
    color: [136, 0, 255], // violet 6600CC CC00FF
    ratio: 213 // 6
  }, {
    alpha: 1.0,
    color: [255, 0, 255], // pink no red CC00FF 000000
    ratio: 255
  }
];


/**
 * If you need to change the gradient, change the hex array as well
 * @type {Array<!GradientColor>}
 */
const HEATMAP_GRADIENT = [
  {
    alpha: 1.0,
    color: [0, 0, 255],
    ratio: 0
  }, {
    alpha: 1.0,
    color: [0, 255, 255],
    ratio: 64
  }, {
    alpha: 1.0,
    color: [0, 255, 0],
    ratio: 128
  }, {
    alpha: 1.0,
    color: [255, 255, 0],
    ratio: 196
  }, {
    alpha: 1.0,
    color: [255, 0, 0],
    ratio: 255
  }
];


/**
 * If you need to change the gradient, change the above map as well
 * @type {Array<string>}
 */
const HEATMAP_GRADIENT_HEX = ['#0000ff', '#00ffff', '#00ff00', '#ffff00', '#ff0000'];


/**
 * @type {Array<string>}
 */
const THERMAL_HEATMAP_GRADIENT = ['#00000000', '#0a000066', '#140d0073', '#1e110077', '#28190073', '#331e0578',
  '#3d1d0479', '#4724047a', '#5126037b', '#5b2a037e', '#662d057f', '#7032057f', '#7a340482', '#84380685', '#8e3b0586',
  '#993f0587', '#a3420589', '#ad45068c', '#b74a068c', '#c14d058f', '#cc500591', '#d6530693', '#e0560694', '#ea5a0595',
  '#f45d0597', '#ff62079a', '#ff640699', '#ff660699', '#ff680699', '#ff6a0699', '#ff6d0599', '#ff6f0599', '#ff710599',
  '#ff730599', '#ff760499', '#ff780499', '#ff7a0499', '#ff7c0499', '#ff7f0399', '#ff810399', '#ff830399', '#ff850399',
  '#ff880299', '#ff8a0299', '#ff8c0299', '#ff8e0299', '#ff910199', '#ff930199', '#ff950199', '#ff970199', '#ff9a0199',
  '#ff9b0198', '#ff9c0197', '#ff9e0297', '#ff9f0296', '#ffa10395', '#ffa20395', '#ffa40394', '#ffa50493', '#ffa70493',
  '#ffa80592', '#ffaa0591', '#ffab0591', '#ffad0690', '#ffae0690', '#ffb0078f', '#ffb1078e', '#ffb3078e', '#ffb4088d',
  '#ffb6088c', '#ffb7098c', '#ffb9098b', '#ffba098a', '#ffbc0a8a', '#ffbd0a89', '#ffbf0b89', '#ffc00c86', '#ffc10d83',
  '#ffc20e81', '#ffc3107e', '#ffc4117c', '#ffc51279', '#ffc61477', '#ffc71574', '#ffc81672', '#ffc9186f', '#ffca196d',
  '#ffcb1a6a', '#ffcc1c68', '#ffcd1d65', '#ffce1e63', '#ffcf2060', '#ffd0215e', '#ffd1225b', '#ffd22459', '#ffd32556',
  '#ffd42654', '#ffd52851', '#ffd6294f', '#ffd72a4c', '#ffd92c4a', '#ffd92d47', '#ffda2f45', '#ffda3042', '#ffdb3240',
  '#ffdc333e', '#ffdc353b', '#ffdd3639', '#ffde3836', '#ffde3a34', '#ffdf3b32', '#ffe03d2f', '#ffe03e2d', '#ffe1402a',
  '#ffe14128', '#ffe24326', '#ffe34423', '#ffe34621', '#ffe4481e', '#ffe5491c', '#ffe54b1a', '#ffe64c17', '#ffe74e15',
  '#ffe74f12', '#ffe85110', '#ffe9530e', '#ffe9540d', '#ffe9560c', '#ffea570c', '#ffea590b', '#ffeb5a0b', '#ffeb5c0a',
  '#ffeb5d0a', '#ffec5f09', '#ffec6108', '#ffed6208', '#ffed6407', '#ffed6507', '#ffee6706', '#ffee6806', '#ffef6a05',
  '#ffef6b05', '#ffef6d04', '#fff06f03', '#fff07003', '#fff17202', '#fff17302', '#fff17501', '#fff27601', '#fff27800',
  '#fff37a00', '#fff37b00', '#fff37d00', '#fff47f00', '#fff48000', '#fff48200', '#fff58400', '#fff58600', '#fff58700',
  '#fff68900', '#fff68b00', '#fff68c00', '#fff78e00', '#fff79000', '#fff89200', '#fff89300', '#fff89500', '#fff99700',
  '#fff99800', '#fff99a00', '#fffa9c00', '#fffa9e00', '#fffa9f00', '#fffba100', '#fffba300', '#fffca500', '#fffca600',
  '#fffca700', '#fffca900', '#fffcaa00', '#fffcac00', '#fffcad00', '#fffcaf00', '#fffcb000', '#fffcb100', '#fffcb300',
  '#fffcb400', '#fffcb600', '#fffcb700', '#fffcb900', '#fffcba00', '#fffcbc00', '#fffcbd00', '#fffcbe00', '#fffcc000',
  '#fffcc100', '#fffcc300', '#fffcc400', '#fffcc600', '#fffcc700', '#fffcc900', '#fffcca05', '#fffccb0a', '#fffccc0f',
  '#fffccd14', '#fffcce19', '#fffccf1e', '#fffcd023', '#fffcd128', '#fffcd22d', '#fffcd333', '#fffcd438', '#fffcd53d',
  '#fffcd742', '#fffcd847', '#fffcd94c', '#fffcda51', '#fffddb56', '#fffddc5b', '#fffddd60', '#fffdde66', '#fffddf6b',
  '#fffde070', '#fffde175', '#fffde27a', '#fffde47f', '#fffde584', '#fffde689', '#fffde78e', '#fffde893', '#fffde999',
  '#fffdea9e', '#fffdeba3', '#fffdeca8', '#fffeedad', '#fffeeeb2', '#fffeefb7', '#fffef0bc', '#fffef2c1', '#fffef3c6',
  '#fffef4cc', '#fffef5d1', '#fffef6d6', '#fffef7db', '#fffef8e0', '#fffef9e5', '#fffefaea', '#fffefbef', '#fffefcf4',
  '#fffefdf9', '#ffffffff'];


/**
 * @type {Array<string>}
 */
const THERMAL_HEATMAP_GRADIENT_HEX = ['#000000', '#000066', '#0d0073', '#110077', '#190073', '#1e0578',
  '#1d0479', '#24047a', '#26037b', '#2a037e', '#2d057f', '#32057f', '#340482', '#380685', '#3b0586',
  '#3f0587', '#420589', '#45068c', '#4a068c', '#4d058f', '#500591', '#530693', '#560694', '#5a0595',
  '#5d0597', '#62079a', '#640699', '#660699', '#680699', '#6a0699', '#6d0599', '#6f0599', '#710599',
  '#730599', '#760499', '#780499', '#7a0499', '#7c0499', '#7f0399', '#810399', '#830399', '#850399',
  '#880299', '#8a0299', '#8c0299', '#8e0299', '#910199', '#930199', '#950199', '#970199', '#9a0199',
  '#9b0198', '#9c0197', '#9e0297', '#9f0296', '#a10395', '#a20395', '#a40394', '#a50493', '#a70493',
  '#a80592', '#aa0591', '#ab0591', '#ad0690', '#ae0690', '#b0078f', '#b1078e', '#b3078e', '#b4088d',
  '#b6088c', '#b7098c', '#b9098b', '#ba098a', '#bc0a8a', '#bd0a89', '#bf0b89', '#c00c86', '#c10d83',
  '#c20e81', '#c3107e', '#c4117c', '#c51279', '#c61477', '#c71574', '#c81672', '#c9186f', '#ca196d',
  '#cb1a6a', '#cc1c68', '#cd1d65', '#ce1e63', '#cf2060', '#d0215e', '#d1225b', '#d22459', '#d32556',
  '#d42654', '#d52851', '#d6294f', '#d72a4c', '#d92c4a', '#d92d47', '#da2f45', '#da3042', '#db3240',
  '#dc333e', '#dc353b', '#dd3639', '#de3836', '#de3a34', '#df3b32', '#e03d2f', '#e03e2d', '#e1402a',
  '#e14128', '#e24326', '#e34423', '#e34621', '#e4481e', '#e5491c', '#e54b1a', '#e64c17', '#e74e15',
  '#e74f12', '#e85110', '#e9530e', '#e9540d', '#e9560c', '#ea570c', '#ea590b', '#eb5a0b', '#eb5c0a',
  '#eb5d0a', '#ec5f09', '#ec6108', '#ed6208', '#ed6407', '#ed6507', '#ee6706', '#ee6806', '#ef6a05',
  '#ef6b05', '#ef6d04', '#f06f03', '#f07003', '#f17202', '#f17302', '#f17501', '#f27601', '#f27800',
  '#f37a00', '#f37b00', '#f37d00', '#f47f00', '#f48000', '#f48200', '#f58400', '#f58600', '#f58700',
  '#f68900', '#f68b00', '#f68c00', '#f78e00', '#f79000', '#f89200', '#f89300', '#f89500', '#f99700',
  '#f99800', '#f99a00', '#fa9c00', '#fa9e00', '#fa9f00', '#fba100', '#fba300', '#fca500', '#fca600',
  '#fca700', '#fca900', '#fcaa00', '#fcac00', '#fcad00', '#fcaf00', '#fcb000', '#fcb100', '#fcb300',
  '#fcb400', '#fcb600', '#fcb700', '#fcb900', '#fcba00', '#fcbc00', '#fcbd00', '#fcbe00', '#fcc000',
  '#fcc100', '#fcc300', '#fcc400', '#fcc600', '#fcc700', '#fcc900', '#fcca05', '#fccb0a', '#fccc0f',
  '#fccd14', '#fcce19', '#fccf1e', '#fcd023', '#fcd128', '#fcd22d', '#fcd333', '#fcd438', '#fcd53d',
  '#fcd742', '#fcd847', '#fcd94c', '#fcda51', '#fddb56', '#fddc5b', '#fddd60', '#fdde66', '#fddf6b',
  '#fde070', '#fde175', '#fde27a', '#fde47f', '#fde584', '#fde689', '#fde78e', '#fde893', '#fde999',
  '#fdea9e', '#fdeba3', '#fdeca8', '#feedad', '#feeeb2', '#feefb7', '#fef0bc', '#fef2c1', '#fef3c6',
  '#fef4cc', '#fef5d1', '#fef6d6', '#fef7db', '#fef8e0', '#fef9e5', '#fefaea', '#fefbef', '#fefcf4',
  '#fefdf9', '#ffffff'];


/**
 * @type {Array<string>}
 */
const RAINBOW_HEATMAP_GRADIENT = ['#00000000', '#0a0000ff', '#140000ff', '#1e0000f6', '#280000f9', '#330000f5',
  '#3d0000f7', '#470000f8', '#510000f5', '#5b0000f6', '#660000f5', '#700000f6', '#7a0000f7', '#840000f5', '#8e0000f6',
  '#990000f5', '#a30000f5', '#ad0000f6', '#b70000f5', '#c10000f6', '#cc0000f5', '#d60000f5', '#e00000f6', '#ea0000f4',
  '#f40000f5', '#ff0000f6', '#ff0006f6', '#ff000cf6', '#ff0013f6', '#ff0019f6', '#ff0020f6', '#ff0026f6', '#ff002cf6',
  '#ff0033f6', '#ff0039f6', '#ff0040f6', '#ff0046f6', '#ff004cf6', '#ff0053f6', '#ff0059f6', '#ff0060f6', '#ff0066f6',
  '#ff006cf6', '#ff0073f6', '#ff0079f6', '#ff0080f6', '#ff0086f6', '#ff008cf6', '#ff0093f6', '#ff0099f6', '#ff01a0f6',
  '#ff00a3f5', '#ff00a6f5', '#ff00a9f4', '#ff00acf4', '#ff00aff4', '#ff00b2f3', '#ff00b5f3', '#ff00b8f2', '#ff00bbf2',
  '#ff00bef2', '#ff00c1f1', '#ff00c4f1', '#ff00c7f0', '#ff00caf0', '#ff00cdf0', '#ff00d0ef', '#ff00d3ef', '#ff00d6ee',
  '#ff00d9ee', '#ff00dcee', '#ff00dfed', '#ff00e2ed', '#ff00e5ec', '#ff00e8ec', '#ff00ecec', '#ff00ece2', '#ff00edd9',
  '#ff00eecf', '#ff00efc6', '#ff00efbc', '#ff00f0b3', '#ff00f1a9', '#ff00f2a0', '#ff00f297', '#ff00f38d', '#ff00f484',
  '#ff00f57a', '#ff00f571', '#ff00f667', '#ff00f75e', '#ff00f854', '#ff00f84b', '#ff00f942', '#ff00fa38', '#ff00fb2f',
  '#ff00fb25', '#ff00fc1c', '#ff00fd12', '#ff00fe09', '#ff00ff00', '#ff0aff00', '#ff14ff00', '#ff1eff00', '#ff28ff00',
  '#ff33ff00', '#ff3dff00', '#ff47ff00', '#ff51ff00', '#ff5bff00', '#ff66ff00', '#ff70ff00', '#ff7aff00', '#ff84ff00',
  '#ff8eff00', '#ff99ff00', '#ffa3ff00', '#ffadff00', '#ffb7ff00', '#ffc1ff00', '#ffccff00', '#ffd6ff00', '#ffe0ff00',
  '#ffeaff00', '#fff4ff00', '#ffffff00', '#fffefc00', '#fffdf900', '#fffcf700', '#fffbf400', '#fffaf200', '#fff9ef00',
  '#fff8ed00', '#fff7ea00', '#fff6e800', '#fff5e500', '#fff4e300', '#fff3e000', '#fff2de00', '#fff1db00', '#fff0d900',
  '#ffefd600', '#ffeed400', '#ffedd100', '#ffeccf00', '#ffebcc00', '#ffeaca00', '#ffe9c700', '#ffe8c500', '#ffe7c200',
  '#ffe7c000', '#ffe7be00', '#ffe8bc00', '#ffe9ba00', '#ffeab800', '#ffebb600', '#ffecb400', '#ffedb200', '#ffeeb000',
  '#ffefae00', '#fff0ac00', '#fff1aa00', '#fff2a800', '#fff3a700', '#fff4a500', '#fff5a300', '#fff6a100', '#fff79f00',
  '#fff89d00', '#fff99b00', '#fffa9900', '#fffb9700', '#fffc9500', '#fffd9300', '#fffe9100', '#ffff9000', '#ffff8a00',
  '#ffff8400', '#ffff7e00', '#ffff7800', '#ffff7300', '#ffff6d00', '#ffff6700', '#ffff6100', '#ffff5c00', '#ffff5600',
  '#ffff5000', '#ffff4a00', '#ffff4500', '#ffff3f00', '#ffff3900', '#ffff3300', '#ffff2e00', '#ffff2800', '#ffff2200',
  '#ffff1c00', '#ffff1700', '#ffff1100', '#ffff0b00', '#ffff0500', '#ffff0000', '#ffff0505', '#ffff0a0a', '#ffff0f0f',
  '#ffff1414', '#ffff1919', '#ffff1e1e', '#ffff2323', '#ffff2828', '#ffff2d2d', '#ffff3333', '#ffff3838', '#ffff3d3d',
  '#ffff4242', '#ffff4747', '#ffff4c4c', '#ffff5151', '#ffff5656', '#ffff5b5b', '#ffff6060', '#ffff6666', '#ffff6b6b',
  '#ffff7070', '#ffff7575', '#ffff7a7a', '#ffff7f7f', '#ffff8484', '#ffff8989', '#ffff8e8e', '#ffff9393', '#ffff9999',
  '#ffff9e9e', '#ffffa3a3', '#ffffa8a8', '#ffffadad', '#ffffb2b2', '#ffffb7b7', '#ffffbcbc', '#ffffc1c1', '#ffffc6c6',
  '#ffffcccc', '#ffffd1d1', '#ffffd6d6', '#ffffdbdb', '#ffffe0e0', '#ffffe5e5', '#ffffeaea', '#ffffefef', '#fffff4f4',
  '#fffff9f9', '#ffffffff'];


/**
 * @type {Array<string>}
 */
const RAINBOW_HEATMAP_GRADIENT_HEX = ['#000000', '#0000ff', '#0000ff', '#0000f6', '#0000f9', '#0000f5',
  '#0000f7', '#0000f8', '#0000f5', '#0000f6', '#0000f5', '#0000f6', '#0000f7', '#0000f5', '#0000f6',
  '#0000f5', '#0000f5', '#0000f6', '#0000f5', '#0000f6', '#0000f5', '#0000f5', '#0000f6', '#0000f4',
  '#0000f5', '#0000f6', '#0006f6', '#000cf6', '#0013f6', '#0019f6', '#0020f6', '#0026f6', '#002cf6',
  '#0033f6', '#0039f6', '#0040f6', '#0046f6', '#004cf6', '#0053f6', '#0059f6', '#0060f6', '#0066f6',
  '#006cf6', '#0073f6', '#0079f6', '#0080f6', '#0086f6', '#008cf6', '#0093f6', '#0099f6', '#01a0f6',
  '#00a3f5', '#00a6f5', '#00a9f4', '#00acf4', '#00aff4', '#00b2f3', '#00b5f3', '#00b8f2', '#00bbf2',
  '#00bef2', '#00c1f1', '#00c4f1', '#00c7f0', '#00caf0', '#00cdf0', '#00d0ef', '#00d3ef', '#00d6ee',
  '#00d9ee', '#00dcee', '#00dfed', '#00e2ed', '#00e5ec', '#00e8ec', '#00ecec', '#00ece2', '#00edd9',
  '#00eecf', '#00efc6', '#00efbc', '#00f0b3', '#00f1a9', '#00f2a0', '#00f297', '#00f38d', '#00f484',
  '#00f57a', '#00f571', '#00f667', '#00f75e', '#00f854', '#00f84b', '#00f942', '#00fa38', '#00fb2f',
  '#00fb25', '#00fc1c', '#00fd12', '#00fe09', '#00ff00', '#0aff00', '#14ff00', '#1eff00', '#28ff00',
  '#33ff00', '#3dff00', '#47ff00', '#51ff00', '#5bff00', '#66ff00', '#70ff00', '#7aff00', '#84ff00',
  '#8eff00', '#99ff00', '#a3ff00', '#adff00', '#b7ff00', '#c1ff00', '#ccff00', '#d6ff00', '#e0ff00',
  '#eaff00', '#f4ff00', '#ffff00', '#fefc00', '#fdf900', '#fcf700', '#fbf400', '#faf200', '#f9ef00',
  '#f8ed00', '#f7ea00', '#f6e800', '#f5e500', '#f4e300', '#f3e000', '#f2de00', '#f1db00', '#f0d900',
  '#efd600', '#eed400', '#edd100', '#eccf00', '#ebcc00', '#eaca00', '#e9c700', '#e8c500', '#e7c200',
  '#e7c000', '#e7be00', '#e8bc00', '#e9ba00', '#eab800', '#ebb600', '#ecb400', '#edb200', '#eeb000',
  '#efae00', '#f0ac00', '#f1aa00', '#f2a800', '#f3a700', '#f4a500', '#f5a300', '#f6a100', '#f79f00',
  '#f89d00', '#f99b00', '#fa9900', '#fb9700', '#fc9500', '#fd9300', '#fe9100', '#ff9000', '#ff8a00',
  '#ff8400', '#ff7e00', '#ff7800', '#ff7300', '#ff6d00', '#ff6700', '#ff6100', '#ff5c00', '#ff5600',
  '#ff5000', '#ff4a00', '#ff4500', '#ff3f00', '#ff3900', '#ff3300', '#ff2e00', '#ff2800', '#ff2200',
  '#ff1c00', '#ff1700', '#ff1100', '#ff0b00', '#ff0500', '#ff0000', '#ff0505', '#ff0a0a', '#ff0f0f',
  '#ff1414', '#ff1919', '#ff1e1e', '#ff2323', '#ff2828', '#ff2d2d', '#ff3333', '#ff3838', '#ff3d3d',
  '#ff4242', '#ff4747', '#ff4c4c', '#ff5151', '#ff5656', '#ff5b5b', '#ff6060', '#ff6666', '#ff6b6b',
  '#ff7070', '#ff7575', '#ff7a7a', '#ff7f7f', '#ff8484', '#ff8989', '#ff8e8e', '#ff9393', '#ff9999',
  '#ff9e9e', '#ffa3a3', '#ffa8a8', '#ffadad', '#ffb2b2', '#ffb7b7', '#ffbcbc', '#ffc1c1', '#ffc6c6',
  '#ffcccc', '#ffd1d1', '#ffd6d6', '#ffdbdb', '#ffe0e0', '#ffe5e5', '#ffeaea', '#ffefef', '#fff4f4',
  '#fff9f9', '#ffffff'];


/**
 * Matrix for converting RGB to YIQ.
 * @type {!goog.math.Matrix}
 */
const RGB_TO_YIQ = new goog.math.Matrix([
  [0.299, 0.587, 0.114],
  [0.595716, -0.274453, -0.321263],
  [0.211456, -0.522591, 0.311135]
]);


/**
 * Matrix for converting YIQ to RGB
 * @type {!goog.math.Matrix}
 */
const YIQ_TO_RGB = new goog.math.Matrix([
  [1.0, 0.9563, 0.6210],
  [1.0, -0.2721, -0.6474],
  [1.0, -1.107, 1.7046]
]);


/**
 * @param {number} ratio
 * @param {Array<GradientColor>=} opt_gradient
 * @return {goog.color.Rgb}
 */
const getGradientColor = function(ratio, opt_gradient) {
  var gradient = opt_gradient || DEFAULT_GRADIENT;

  // if the ratio is outside the bounds of the gradient, return the boundary color.
  if (ratio <= gradient[0].ratio) {
    return gradient[0].color;
  } else if (ratio >= gradient[gradient.length - 1].ratio) {
    return gradient[gradient.length - 1].color;
  }

  // figure out where the ratio falls on the gradient
  for (var i = 0, len = gradient.length - 1; i < len; i++) {
    if (ratio >= gradient[i].ratio && ratio < gradient[i + 1].ratio) {
      // linear gradient between 2 colors
      var color1 = gradient[i].color;
      var color2 = gradient[i + 1].color;

      // get the value for each color channel
      var r1 = color1[0];
      var g1 = color1[1];
      var b1 = color1[2];

      var r2 = color2[0];
      var g2 = color2[1];
      var b2 = color2[2];

      var step = ratio - gradient[i].ratio;
      var max = gradient[i + 1].ratio - gradient[i].ratio;

      // interpolate the value for each color channel
      var r = interpolate(r1, r2, step, max);
      var g = interpolate(g1, g2, step, max);
      var b = interpolate(b1, b2, step, max);

      return [r, g, b];
    }
  }

  return [0, 0, 0];
};


/**
 * Creates a uniform hue gradient across the HSL spectrum.
 *
 * @param {number} size The number of colors to return in the gradient
 * @param {number=} opt_min The minimum HSL value to use (0-360)
 * @param {number=} opt_max The maximum HSL value to use (0-360)
 * @param {boolean=} opt_distinct If true, makes adjustments to the gradient colors to try making them more distinct.
 * @return {!Array<string>} An array of colors as hex strings.
 */
const getHslGradient = function(size, opt_min, opt_max, opt_distinct) {
  var gradient = [];
  var min = opt_min !== undefined ? goog.math.clamp(opt_min, 0, 360) : 0;
  var max = opt_max !== undefined ? goog.math.clamp(opt_max, min, 360) : 360;

  var range = max - min;
  var lastHue = 0;
  for (var i = 0, n = size; i < n; i++) {
    var hue = Math.round(i / n * range) + min;
    var lightness = 0.5;

    if (opt_distinct) {
      // make adjustments based on the current hue in an effort to distinguish the gradient colors
      if (hue >= 70 && lastHue <= 50) {
        // yellow lies in a very narrow range - don't skip it!
        hue = 60;
      } else if (hue >= 100 && hue <= 160) {
        // greens tend to look very similar, so this provides a lightness adjustment so hues in the green range will
        // have their lightness adjusted linearly over the green range
        lightness += (hue - 130) / 240;
      }
    }

    gradient.push(goog.color.hslArrayToHex([hue, 1.0, lightness]));
    lastHue = hue;
  }

  return gradient;
};


/**
 * @return {goog.color.Rgb}
 */
const getRandomColor = function() {
  return getGradientColor(Math.floor(Math.random() * 255), COLOR_WHEEL);
};


/**
 * @param {boolean=} opt_rgba If the string should be in rgba format, otherwise returns hex.
 * @return {string}
 */
const getRandomColorString = function(opt_rgba) {
  var color = getRandomColor();
  if (opt_rgba) {
    return 'rgba(' + color[0] + ',' + color[1] + ',' + color[2] + ',1)';
  }

  return goog.color.rgbArrayToHex(color);
};


/**
 * @param {number} begin
 * @param {number} end
 * @param {number} step
 * @param {number} max
 * @return {number}
 */
const interpolate = function(begin, end, step, max) {
  if (begin < end) {
    return Math.floor(((end - begin) * (step / max)) + begin);
  } else {
    return Math.floor(((begin - end) * (1 - (step / max))) + end);
  }
};


/**
 * Hex color wrapper for goog.color.darken.
 *
 * @param {string} color
 * @param {number} factor
 * @return {string}
 */
const darken = function(color, factor) {
  var rgb = goog.color.hexToRgb(color);
  var darker = goog.color.darken(rgb, factor);
  return goog.color.rgbArrayToHex(darker);
};


/**
 * Hex color wrapper for goog.color.lighten.
 *
 * @param {string} color
 * @param {number} factor
 * @return {string}
 */
const lighten = function(color, factor) {
  var rgb = goog.color.hexToRgb(color);
  var lighter = goog.color.lighten(rgb, factor);
  return goog.color.rgbArrayToHex(lighter);
};


/**
 * Gets a color change matrix
 *
 * @param {!goog.color.Rgb} from
 * @param {!goog.color.Rgb} to
 * @return {!Array<number>} The matrix
 */
const changeColor = function(from, to) {
  var matrix = [
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 0, 0,
    0, 0, 0, 1, 0
  ];

  if (to[0] === 0 && to[1] === 0 && to[2] === 0) {
    return matrix;
  }

  var srcMax = Math.max(from[0], from[1], from[2]);
  var srcMaxPos = srcMax == from[0] ? 0 :
    srcMax == from[1] ? 1 : 2;

  var dstMax = Math.max(to[0], to[1], to[2]);
  var dstRatios = [
    to[0] / dstMax,
    to[1] / dstMax,
    to[2] / dstMax
  ];

  for (var i = 0; i < 3; i++) {
    matrix[i * 5 + srcMaxPos] = dstRatios[i] * dstMax / srcMax;
  }

  return matrix;
};


/**
 * Pads a hex color string to the correct number of digits in case it is lacking leading 0's.
 *
 * @param {string} str The hex color string
 * @param {string=} opt_prefix The output prefix (defaults to none)
 * @param {string=} opt_default The default color ('ffffff' if not provided)
 * @return {string} The padded hex color string
 */
const padHexColor = function(str, opt_prefix, opt_default) {
  var prefix = opt_prefix || '';
  str = str.trim().replace(/^(0x|#)/, '');

  if (!str || isNaN(Number('0x' + str))) {
    // default to white if the color is invalid
    return opt_default || (prefix + 'ffffff');
  }

  while (str.length < 6) {
    str = '0' + str;
  }
  return prefix + str;
};


/**
 * Check if a value contains a valid color string.
 *
 * @param {*} value
 * @return {boolean}
 */
const isColorString = function(value) {
  return typeof value == 'string' && HEX_REGEX.test(value) || RGBA_REGEX.test(value);
};


/**
 * Converts all color types to a standard hex string.
 *
 * @param {Array<number>|string} color
 * @return {string}
 */
const toHexString = function(color) {
  return goog.color.rgbArrayToHex(typeof color === 'string' ? toRgbArray(color) : color);
};


/**
 * Convert a color to the server format. This ensures a consistent format/case for caching purposes.
 *
 * @param {Array<number>|string} value The color
 * @return {string} A color in the format "0xAABBCC"
 */
const toServerString = function(value) {
  var hexColor = toHexString(value);
  return hexColor.toUpperCase().replace(/^#/, '0x');
};


/**
 * @param {Array<number>|string} color
 * @return {Array<number>}
 */
const toRgbArray = function(color) {
  if (typeof color == 'string') {
    var colorStr = /** @type {string} */ (color);

    var i = colorStr.indexOf(',');
    if (i == -1) {
      // no commas indicate hex
      colorStr = colorStr.replace(/0x/ig, '');
      colorStr = '#' + colorStr.replace(/[^a-f0-9]/ig, '');
      color = goog.color.hexToRgb(colorStr);

      if (color && color.length == 3) {
        // all the alpha
        color.push(1);
      }
    } else {
      var match = colorStr.match(RGBA_MATCH_REGEX);
      if (match && match.length >= 5) {
        var alpha = Number(match[4]);
        color = [Number(match[1]), Number(match[2]), Number(match[3]), isNaN(alpha) ? 1 : alpha];
      } else {
        // not a valid rgb/rgba string, return null
        color = null;
      }
    }
  }

  return color;
};


/**
 * Converts passed in hex string colors to HSL to sort them.
 *
 * @param {string} c1
 * @param {string} c2
 * @return {number}
 */
const colorSort = function(c1, c2) {
  var hsl1 = goog.color.hexToHsl(c1);
  var hsl2 = goog.color.hexToHsl(c2);

  var val1 = Math.round(hsl1[0] * 100) + Math.round(hsl1[1] * 100) / 100 + Math.round(hsl1[2] * 100) / 10000;
  var val2 = Math.round(hsl2[0] * 100) + Math.round(hsl2[1] * 100) / 100 + Math.round(hsl2[2] * 100) / 10000;

  return goog.array.defaultCompare(val2, val1);
};


/**
 * Helper for determining if two color values are equal. Handy if you want to compare an RGB array with a string, or
 * have strings with differing capitalization, etc.
 *
 * @param {string|goog.color.Rgb} color1
 * @param {string|goog.color.Rgb} color2
 * @return {boolean} [description]
 */
const equals = function(color1, color2) {
  if (color1 == color2) {
    // skip any further checks, this also handles null/undefined comparisons
    return true;
  }

  if (!Array.isArray(color1)) {
    color1 = toRgbArray(color1);
  }

  if (!Array.isArray(color2)) {
    color2 = toRgbArray(color2);
  }

  return goog.array.equals(color1, color2);
};


/**
 * Normalize an opacity value between 0 and 1 with up to two decimal places.
 *
 * @param {number} opacity The opacity.
 * @return {number} The normalized opacity.
 */
const normalizeOpacity = function(opacity) {
  return Math.round(goog.math.clamp(opacity, 0, 1) * 100) / 100;
};


/**
 * Converts a color in RGB to YIQ.
 *
 * @param {!Array<number>} rgb The color in RGB
 * @param {Array<number>=} opt_result Target array for the YIQ values
 *
 * @return {!Array<number>}
 */
const rgbToYiq = function(rgb, opt_result) {
  var mat = new goog.math.Matrix([rgb]);
  return RGB_TO_YIQ.multiply(mat).toArray()[0];
};


/**
 * Converts a color in YIQ to RGB.
 *
 * @param {!Array<number>} yiq The color in YIQ
 * @param {Array<number>=} opt_result Target array for the RGB values
 *
 * @return {!Array<number>}
 */
const yiqToRgb = function(yiq, opt_result) {
  var mat = new goog.math.Matrix([yiq]);
  return YIQ_TO_RGB.multiply(mat).toArray()[0];
};


/**
 * Converts an integer color representation to a hex string
 *
 * @param {number} num The integer color.
 * @return {string} The hex representation.
 */
const intToHex = function(num) {
  num = goog.math.clamp(num | 0, 0, 0xffffff);
  return '#' + ('00000' + (num | 0).toString(16)).substr(-6);
};


/**
 * Transforms the hue of a color in the YIQ color space.
 *
 * @param {!Array<number>} rgb The original color in RGB
 * @param {number} hue The hue offset in radians
 *
 * @return {Array<number>} The adjusted color in RGB
 */
const transformHue = function(rgb, hue) {
  var yiq = rgbToYiq(rgb);
  hue = Math.atan2(yiq[2], yiq[1]) + goog.math.toRadians(hue);
  var chroma = Math.sqrt(yiq[2] * yiq[2] + yiq[1] * yiq[1]);

  var newYiq = [yiq[0], chroma * Math.cos(hue), chroma * Math.sin(hue)];
  return yiqToRgb(newYiq);
};


/**
 * Calculates the hue offset, in radians, to transform a source color to another color using the YIQ color space.
 *
 * @param {!Array<number>} src The original color in RGB
 * @param {!Array<number>} target The target color in RGB
 * @param {boolean=} opt_normalize If colors should be normalized before calculating hue shift
 *
 * @return {number} The hue offset, in radians
 */
const calculateHueTransform = function(src, target, opt_normalize) {
  if (opt_normalize) {
    // translating from grayscale won't produce an accurate hue offset because grayscale is really an absence of
    // saturation with varying lightness, not a color. treating grayscale as blue (#0000ff) will mostly resolve this.
    // the exception is that white > blue hue transformation can't be done. that problem cannot be resolved with a
    // simple hue shift.
    var srcHsl = goog.color.rgbArrayToHsl(src);
    var srcHue = srcHsl[0] == 0 && srcHsl[1] == 0 ? 240 : srcHsl[0];

    var targetHsl = goog.color.rgbArrayToHsl(target);

    // convert the source/target color to have max saturation and mid lightness. this normalizes the hue translation
    // across all colors.
    src = goog.color.hslArrayToRgb([srcHue, 1, 0.5]);
    target = goog.color.hslArrayToRgb([targetHsl[0], 1, 0.5]);
  }

  var yiq1 = rgbToYiq(src);
  var yiq2 = rgbToYiq(target);

  var hue1 = Math.atan2(yiq1[2], yiq1[1]);
  var hue2 = Math.atan2(yiq2[2], yiq2[1]);

  return hue2 - hue1;
};


/**
 * Applies a colorize transform to an array of image data. This changes every non-zero channel in the array to the
 * passed in color.
 *
 * @param {Array<number>} data The image data to colorize
 * @param {string|Array<number>} tgtColor The target color either as an rgba string or array
 */
const colorize = function(data, tgtColor) {
  var rgbaColor;
  if (Array.isArray(tgtColor)) {
    rgbaColor = tgtColor;
  } else {
    rgbaColor = toRgbArray(tgtColor);
  }

  for (var i = 0, n = data.length; i < n; i += 4) {
    data[i] = rgbaColor[0];
    data[i + 1] = rgbaColor[1];
    data[i + 2] = rgbaColor[2];
  }
};

/**
 * Applies a color transform to an array of image data. This transform takes a target color and adjusts the color
 * for saturation color and brightness.
 *
 * @param {Array<number>} data The image data to colorize
 * @param {number} brightness The target brightness. The range is -1 to 1.
 * @param {number} contrast The target contrast. The range is 0 to 2.
 * @param {number} saturation The target saturation. The range is 0 to 1.
 */
const adjustColor = function(data, brightness, contrast, saturation) {
  var intercept = (1 - contrast) / 2;
  var sr = (1 - saturation) * 0.3086;
  var sg = (1 - saturation) * 0.6094;
  var sb = (1 - saturation) * 0.0820;
  brightness = brightness * 225;

  // color transform matrix for contrast and saturation, taken from online research https://docs.rainmeter.net/tips/colormatrix-guide/
  var m = [
    contrast * (sr + saturation), contrast * sr, contrast * sr, 0, 0,
    contrast * sg, contrast * (sg + saturation), sg * contrast, 0, 0,
    contrast * sb, contrast * sb, contrast * (sb + saturation), 0, 0,
    0, 0, 0, 1, 0,
    intercept + brightness, intercept + brightness, intercept + brightness, 1, 0
  ];


  for (var i = 0, n = data.length; i < n; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    var a = data[i + 3];
    data[i] = Math.round((r * m[0] + g * m[5] + b * m[10] + a * m[15] + m[20]));
    data[i + 1] = Math.round((r * m[1] + g * m[6] + b * m[11] + a * m[16] + m[21]));
    data[i + 2] = Math.round((r * m[2] + g * m[7] + b * m[12] + a * m[17] + m[22]));
    data[i] = goog.math.clamp(data[i], 0, 255);
    data[i + 1] = goog.math.clamp(data[i + 1], 0, 255);
    data[i + 2] = goog.math.clamp(data[i + 2], 0, 255);
  }
};

/**
 * Applies a color transform to an array of image data. This transform takes a source and target color and blends
 * the alpha using a color transform matrix to produce a more natural version of the target color.
 *
 * @param {Array<number>} data The image data to colorize
 * @param {string|Array<number>} srcColor The source color either as an rgba string or array
 * @param {string|Array<number>} tgtColor The target color either as an rgba string or array
 */
const transformColor = function(data, srcColor, tgtColor) {
  var srcRgb;
  var tgtRgb;

  if (Array.isArray(srcColor)) {
    srcRgb = srcColor;
  } else {
    srcRgb = toRgbArray(srcColor);
  }

  if (Array.isArray(tgtColor)) {
    tgtRgb = tgtColor;
  } else {
    tgtRgb = toRgbArray(tgtColor);
  }

  // find the maximum color channel in the source and target and construct a ratio
  var srcMax = Math.max(srcRgb[0], srcRgb[1], srcRgb[2]);
  var srcIdx = srcMax == srcRgb[0] ? 0 : (srcMax == srcRgb[1] ? 1 : 2);

  var tgtMax = Math.max(tgtRgb[0], tgtRgb[1], tgtRgb[2]);
  var tgtRatios = [tgtRgb[0] / tgtMax, tgtRgb[1] / tgtMax, tgtRgb[2] / tgtMax];
  var ratio = tgtMax / srcMax;

  var tgtRatio0 = tgtRatios[0] * ratio;
  var tgtRatio1 = tgtRatios[1] * ratio;
  var tgtRatio2 = tgtRatios[2] * ratio;

  // color transform matrix, taken from an old Flash/Flex utility and a little online research
  var m = [
    srcIdx == 0 ? tgtRatio0 : 0, srcIdx == 1 ? tgtRatio0 : 0, srcIdx == 2 ? tgtRatio0 : 0, 0, 0,
    srcIdx == 0 ? tgtRatio1 : 0, srcIdx == 1 ? tgtRatio1 : 0, srcIdx == 2 ? tgtRatio1 : 0, 0, 0,
    srcIdx == 0 ? tgtRatio2 : 0, srcIdx == 1 ? tgtRatio2 : 0, srcIdx == 2 ? tgtRatio2 : 0, 0, 0,
    0, 0, 0, 1, 0
  ];

  for (var i = 0, n = data.length; i < n; i += 4) {
    var r = data[i];
    var g = data[i + 1];
    var b = data[i + 2];
    var a = data[i + 3];

    // apply the color matrix with the following assumptions to improve performance:
    // 1) we don't need to change anything if r == g == b == a == 0 because m4, m9 and m14 are always 0
    // 2) we don't need to muck with the alpha channel calculation due to the assumed structure of the matrix
    if (r !== 0 || g !== 0 || b !== 0 || a !== 0) {
      data[i] = r * m[0] + g * m[1] + b * m[2] + a * m[3] + m[4];
      data[i + 1] = r * m[5] + g * m[6] + b * m[7] + a * m[8] + m[9];
      data[i + 2] = r * m[10] + g * m[11] + b * m[12] + a * m[13] + m[14];
    }
  }
};

exports = {
  GradientColor,
  COLOR_WHEEL,
  DEFAULT_GRADIENT,
  HEATMAP_GRADIENT,
  HEATMAP_GRADIENT_HEX,
  HEX_REGEX,
  RAINBOW_HEATMAP_GRADIENT,
  RAINBOW_HEATMAP_GRADIENT_HEX,
  RGBA_MATCH_REGEX,
  RGBA_REGEX,
  RGB_TO_YIQ,
  THERMAL_HEATMAP_GRADIENT,
  THERMAL_HEATMAP_GRADIENT_HEX,
  YIQ_TO_RGB,
  adjustColor,
  calculateHueTransform,
  changeColor,
  colorSort,
  colorize,
  darken,
  equals,
  getGradientColor,
  getHslGradient,
  getRandomColor,
  getRandomColorString,
  intToHex,
  interpolate,
  isColorString,
  lighten,
  normalizeOpacity,
  padHexColor,
  rgbToYiq,
  toHexString,
  toRgbArray,
  toServerString,
  transformColor,
  transformHue,
  yiqToRgb
};
