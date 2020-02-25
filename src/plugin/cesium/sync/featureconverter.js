goog.module('plugin.cesium.sync.convert');

const {convertGeometry} = goog.require('plugin.cesium.sync.converter');

const Feature = goog.requireType('ol.Feature');
const OLVectorLayer = goog.requireType('ol.layer.Vector');
const Style = goog.requireType('ol.style.Style');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');


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
        const geometry = style.getGeometryFunction()(feature);
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
    style = featureStyle.call(feature, resolution);
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

  if (!Array.isArray(style)) {
    scratchStyleArray[0] = style;
    return scratchStyleArray;
  }

  return style;
};


exports = convert;
