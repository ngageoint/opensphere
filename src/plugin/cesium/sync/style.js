goog.declareModuleId('plugin.cesium.sync.style');

import olcsCore from 'ol-cesium/src/olcs/core.js';
import {DEFAULT_FEATURE_SIZE, DEFAULT_HIGHLIGHT_CONFIG} from '../../../os/style/style.js';
import {OUTLINE_REGEXP} from '../cesium.js';


/**
 * @param {!(Style|Text)} style
 * @param {!VectorContext} context
 * @param {!GeometryInstanceId} geometryInstanceId
 * @return {!Cesium.Color}
 */
export const getColor = (style, context, geometryInstanceId) => {
  const isOutline = OUTLINE_REGEXP.test(geometryInstanceId);
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
export const getLineWidthFromStyle = (style) => {
  // make sure the width is at least 1px
  return Math.max(1, /** @type {number} */ (style.getStroke() && style.getStroke().getWidth() || DEFAULT_FEATURE_SIZE));
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
    return (DEFAULT_HIGHLIGHT_CONFIG.stroke.color === style.getStroke().getColor());
  }
  return false;
};
