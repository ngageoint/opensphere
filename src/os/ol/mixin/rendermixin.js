/**
 * @fileoverview This file explicitly contains a set of mixins for the OL3 canvas renderer.
 */
goog.declareModuleId('os.ol.mixin.render');

import Instruction from 'ol/src/render/canvas/Instruction.js';
import PolygonReplay from 'ol/src/render/canvas/PolygonBuilder.js';

/**
 * Empty fill style used in our overrides of OL3 polygon rendering functions.
 * @type {string}
 */
export const EMPTY_FILL = 'rgba(0,0,0,0)';

/**
 * THIN-4258: Polygons without fills should only hit detect the stroke.
 * THIN-6594: This was previously breaking after modifying the first set of instructions. This only fixes the first
 * polygon fill. It must iterate over the entire hitDetectionInstructions array and fix them all.
 * THIN-4636: The saga continues. We are now entirely replacing drawPolygon because the other hack
 * sucked worse.
 *
 * @param {Polygon|RenderFeature} polygonGeometry
 * @param {Feature|RenderFeature} feature
 * @suppress {duplicate|accessControls}
 * @override
 */
PolygonReplay.prototype.drawPolygon = function(polygonGeometry, feature) {
  var state = this.state;
  this.setFillStrokeStyles_(polygonGeometry);
  this.beginGeometry(polygonGeometry, feature);

  // THIN-4636: this override exists to insert this line, otherwise this function is a copy-paste of the OL3
  // version. The hit detection instruction for fills needs to use the available value from the frame state
  // or be empty.
  this.hitDetectionInstructions.push(
      [Instruction.SET_FILL_STYLE,
        state.fillStyle ? state.fillStyle : EMPTY_FILL]);

  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      Instruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var ends = polygonGeometry.getEnds();
  var flatCoordinates = polygonGeometry.getOrientedFlatCoordinates();
  var stride = polygonGeometry.getStride();
  this.drawFlatCoordinatess_(flatCoordinates, 0, ends, stride);
  this.endGeometry(polygonGeometry, feature);
};

/**
 * THIN-4636: The saga continues. We are now entirely replacing drawMultiPolygon because the other hack
 * sucked worse.
 *
 * @param {MultiPolygon} multiPolygonGeometry
 * @param {Feature|RenderFeature} feature
 * @suppress {duplicate|accessControls}
 * @override
 */
PolygonReplay.prototype.drawMultiPolygon = function(multiPolygonGeometry, feature) {
  var state = this.state;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(multiPolygonGeometry);
  this.beginGeometry(multiPolygonGeometry, feature);

  // THIN-4636: this override exists to insert this line, otherwise this function is a copy-paste of the OL3
  // version. The hit detection instruction for fills needs to use the available value from the frame state
  // or be empty.
  this.hitDetectionInstructions.push(
      [Instruction.SET_FILL_STYLE, fillStyle ? fillStyle : EMPTY_FILL]);

  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      Instruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var endss = multiPolygonGeometry.getEndss();
  var flatCoordinates = multiPolygonGeometry.getOrientedFlatCoordinates();
  var stride = multiPolygonGeometry.getStride();
  var offset = 0;
  var i;
  var ii;
  for (i = 0, ii = endss.length; i < ii; ++i) {
    offset = this.drawFlatCoordinatess_(
        flatCoordinates, offset, endss[i], stride);
  }
  this.endGeometry(multiPolygonGeometry, feature);
};

/**
 * THIN-4636: The saga continues. We are now entirely replacing drawCircle because the other hack
 * sucked worse.
 *
 * @param {Circle} circleGeometry
 * @param {Feature|RenderFeature} feature
 * @suppress {duplicate|accessControls}
 * @override
 */
PolygonReplay.prototype.drawCircle = function(circleGeometry, feature) {
  var state = this.state;
  var fillStyle = state.fillStyle;
  var strokeStyle = state.strokeStyle;
  if (fillStyle === undefined && strokeStyle === undefined) {
    return;
  }
  this.setFillStrokeStyles_(circleGeometry);
  this.beginGeometry(circleGeometry, feature);

  // THIN-4636: this override exists to insert this line, otherwise this function is a copy-paste of the OL3
  // version. The hit detection instruction for fills needs to use the available value from the frame state
  // or be empty.
  this.hitDetectionInstructions.push(
      [Instruction.SET_FILL_STYLE, fillStyle ? fillStyle : EMPTY_FILL]);

  if (state.strokeStyle !== undefined) {
    this.hitDetectionInstructions.push([
      Instruction.SET_STROKE_STYLE,
      state.strokeStyle, state.lineWidth, state.lineCap, state.lineJoin,
      state.miterLimit, state.lineDash, state.lineDashOffset
    ]);
  }
  var flatCoordinates = circleGeometry.getFlatCoordinates();
  var stride = circleGeometry.getStride();
  var myBegin = this.coordinates.length;
  this.appendFlatCoordinates(
      flatCoordinates, 0, flatCoordinates.length, stride, false, false);
  var beginPathInstruction = [Instruction.BEGIN_PATH];
  var circleInstruction = [Instruction.CIRCLE, myBegin];
  this.instructions.push(beginPathInstruction, circleInstruction);
  this.hitDetectionInstructions.push(beginPathInstruction, circleInstruction);
  var fillInstruction = [Instruction.FILL];
  this.hitDetectionInstructions.push(fillInstruction);
  if (state.fillStyle !== undefined) {
    this.instructions.push(fillInstruction);
  }
  if (state.strokeStyle !== undefined) {
    var strokeInstruction = [Instruction.STROKE];
    this.instructions.push(strokeInstruction);
    this.hitDetectionInstructions.push(strokeInstruction);
  }
  this.endGeometry(circleGeometry, feature);
};
