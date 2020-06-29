goog.module('plugin.cesium.sync.style');

const olcsCore = goog.require('olcs.core');

const Style = goog.requireType('ol.style.Style');
const Text = goog.requireType('ol.style.Text');
const {GeometryInstanceId} = goog.requireType('plugin.cesium');
const VectorContext = goog.requireType('plugin.cesium.VectorContext');

/**
 * @param {!(Style|Text)} style
 * @param {!VectorContext} context
 * @param {!GeometryInstanceId} geometryInstanceId
 * @return {!Cesium.Color}
 */
const getColor = (style, context, geometryInstanceId) => {
  const isOutline = plugin.cesium.OUTLINE_REGEXP.test(geometryInstanceId);
  const color = getColorFromStyle(style, isOutline);

  if (isOutline && !isHighlightStyle(style) && !style.getStroke()) {
    // special Case for handling geometries without outlines
    color.alpha = 0;
  } else {
    color.alpha *= context.layer.getOpacity();
  }

  return color;
};


/**
 * Return the width of stroke from a plain ol style. Let Cesium handle system line width issues.
 *
 * @param {!Style|Text} style
 * @return {number}
 */
const getLineWidthFromStyle = (style) => {
  // make sure the width is at least 1px
  return Math.max(1, /** @type {number} */ (style.getStroke() && style.getStroke().getWidth() ||
      os.style.DEFAULT_FEATURE_SIZE));
};


/**
 * Return the fill or stroke color from a plain openlayers style.
 *
 * @param {!(Style|Text)} style
 * @param {boolean} isOutline
 * @return {!Cesium.Color}
 */
const getColorFromStyle = (style, isOutline) => {
  const fillColor = style.getFill() ? style.getFill().getColor() : null;
  const strokeColor = style.getStroke() ? style.getStroke().getColor() : null;

  let olColor = 'black';
  if (strokeColor && isOutline) {
    olColor = strokeColor;
  } else if (fillColor) {
    olColor = fillColor;
  }

  return olcsCore.convertColorToCesium(olColor);
};


/**
 * @param {!(Style|Text)} style
 * @return {boolean}
 */
const isHighlightStyle = (style) => {
  if (style && style.getStroke()) {
    return (os.style.DEFAULT_HIGHLIGHT_CONFIG.stroke.color === style.getStroke().getColor());
  }
  return false;
};


exports = {
  getColor,
  getLineWidthFromStyle
};

