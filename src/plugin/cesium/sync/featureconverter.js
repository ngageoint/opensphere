goog.declareModuleId('plugin.cesium.sync.convert');

import {convertGeometry} from './converter.js';


/**
 * @param {!Feature} feature
 * @param {number} resolution
 * @param {!VectorContext} context
 */
const convert = (feature, resolution, context) => {
  context.markDirty(feature);

  const styles = getFeatureStyles(feature, resolution, context.layer);
  if (styles) {
    for (let i = 0, n = styles.length; i < n; i++) {
      const style = styles[i];
      if (style) {
        const geometry = /** @type {Geometry} */ (style.getGeometryFunction()(feature));
        if (geometry) {
          convertGeometry(feature, geometry, style, context);
        }
      }
    }
  }

  context.removeDirty(feature);
};


/**
 * @type {!Array<!Style>}
 */
const scratchStyleArray = [];


/**
 * Get the style used to render a feature.
 *
 * @param {!Feature} feature
 * @param {number} resolution
 * @param {!OLVectorLayer} layer
 * @return {Array<Style>} null if no style is available
 */
const getFeatureStyles = (feature, resolution, layer) => {
  var style;

  // feature style takes precedence
  var featureStyle = feature.getStyleFunction();
  if (featureStyle !== undefined) {
    style = featureStyle.call(feature, feature, resolution, true);
  }

  // use the fallback if there isn't one
  if (style == null) {
    var layerStyle = layer.getStyleFunction();
    if (layerStyle) {
      style = layerStyle(feature, resolution);
    }
  }

  if (!style) {
    return null;
  }

  // This block is needed to satisfy the compiler, although I haven't found a way
  // to invoke it via tests (which I think means there's a deficiency in the OL closure
  // type definitions).
  if (!Array.isArray(style)) {
    scratchStyleArray[0] = style;
    return scratchStyleArray;
  }

  return style;
};


export default convert;
