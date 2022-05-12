goog.declareModuleId('plugin.cesium.sync.shape');

import {asColorLike} from 'ol/src/colorlike.js';
import {createCanvasContext2D} from 'ol/src/dom.js';
import {defaultStrokeStyle, defaultLineWidth, defaultLineJoin, defaultLineCap, defaultMiterLimit} from 'ol/src/render/canvas.js';
import RegularShape from 'ol/src/style/RegularShape.js';

/**
 * @param {!OLRegularShape} style
 * @return {HTMLCanvasElement}
 * @suppress {accessControls}
 */
export const drawShape = (style) => {
  const fill = style.getFill();
  let oldColor = null;

  if (fill) {
    oldColor = fill.getColor();
    fill.setColor('rgba(255,255,255,1)');
  }

  const renderOptions = getRenderOptions(style);

  const scratchFakeShape = new RegularShape({
    points: style.getPoints(),
    radius: style.getRadius(),
    radius2: style.getRadius2(),
    angle: style.getAngle(),
    fill: style.getFill(),
    stroke: style.getStroke()
  });

  const context = createCanvasContext2D(renderOptions.size, renderOptions.size);
  renderOptions.size = context.canvas.width;
  RegularShape.prototype.draw_.call(scratchFakeShape, renderOptions, context, 1);

  if (fill) {
    fill.setColor(oldColor);
  }

  return context.canvas;
};


/**
 * @param {OLRegularShape} style
 * @return {!ol.RegularShapeRenderOptions}
 */
const getRenderOptions = (style) => {
  let lineCap = '';
  let lineJoin = '';
  let miterLimit = 0;
  let lineDash = null;
  let lineDashOffset = 0;
  let strokeStyle;
  let strokeWidth = 0;
  const stroke = style.getStroke();

  if (stroke) {
    strokeStyle = stroke.getColor();
    if (strokeStyle === null) {
      strokeStyle = defaultStrokeStyle;
    }
    strokeStyle = asColorLike(strokeStyle);
    strokeWidth = stroke.getWidth();
    if (strokeWidth === undefined) {
      strokeWidth = defaultLineWidth;
    }
    lineDash = stroke.getLineDash();
    lineDashOffset = stroke.getLineDashOffset();
    if (!stroke.setLineDash) {
      lineDash = null;
      lineDashOffset = 0;
    }
    lineJoin = stroke.getLineJoin();
    if (lineJoin === undefined) {
      lineJoin = defaultLineJoin;
    }
    lineCap = stroke.getLineCap();
    if (lineCap === undefined) {
      lineCap = defaultLineCap;
    }
    miterLimit = stroke.getMiterLimit();
    if (miterLimit === undefined) {
      miterLimit = defaultMiterLimit;
    }
  }

  const size = 2 * (style.getRadius() + strokeWidth) + 1;

  return {
    strokeStyle: strokeStyle,
    strokeWidth: strokeWidth,
    size: size,
    lineCap: lineCap,
    lineDash: lineDash,
    lineDashOffset: lineDashOffset,
    lineJoin: lineJoin,
    miterLimit: miterLimit
  };
};
