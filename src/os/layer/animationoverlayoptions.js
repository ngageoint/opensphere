goog.module('os.layer.AnimationOverlayOptions');
goog.module.declareLegacyNamespace();

const Feature = goog.requireType('ol.Feature');
const OLMap = goog.requireType('ol.Map');
const Style = goog.requireType('ol.style.Style');


/**
 * @typedef {{
 *   features: (Array<!Feature>|undefined),
 *   map: (OLMap|undefined),
 *   style: (Style|Array<Style>|ol.StyleFunction|undefined),
 *   opacity: (number|undefined),
 *   zIndex: (number|undefined)
 * }}
 */
let AnimationOverlayOptions;

exports = AnimationOverlayOptions;
