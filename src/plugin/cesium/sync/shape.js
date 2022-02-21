goog.declareModuleId('plugin.cesium.sync.shape');

import {asColorLike} from 'ol/colorlike';
import {createCanvasContext2D} from 'ol/dom';
import {defaultStrokeStyle, defaultLineWidth, defaultLineJoin, defaultLineCap, defaultMiterLimit} from 'ol/render/canvas';
import OLRegularShape from 'ol/style/RegularShape';


/**
 * @type {OLRegularShape}
 */
const scratchFakeShape = /** @type {OLRegularShape} */ ({
  points_: 0,
  radius_: 0,
  radius2_: 0,
  angle_: 0,
  fill_: null,
  stroke_: null
});


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

  scratchFakeShape.points_ = style.getPoints();
  scratchFakeShape.radius_ = style.getRadius();
  scratchFakeShape.radius2_ = style.getRadius2();
  scratchFakeShape.angle_ = style.getAngle();
  scratchFakeShape.fill_ = style.getFill();
  scratchFakeShape.stroke_ = style.getStroke();

  const context = createCanvasContext2D(renderOptions.size, renderOptions.size);
  renderOptions.size = context.canvas.width;
  OLRegularShape.prototype.draw_.call(scratchFakeShape, renderOptions, context, 0, 0);

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
    if (!stroke.context.setLineDash) {
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
