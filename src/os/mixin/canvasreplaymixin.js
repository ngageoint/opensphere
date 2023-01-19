goog.declareModuleId('os.mixin.canvasreplay');

import {equals} from 'ol/src/array.js';
import {intersects} from 'ol/src/extent.js';
import {lineStringLength} from 'ol/src/geom/flat/length.js';
import {drawTextOnPath} from 'ol/src/geom/flat/textpath.js';
import {transform2D} from 'ol/src/geom/flat/transform.js';
import Replay from 'ol/src/render/canvas/ExecutorGroup.js';
import Instruction from 'ol/src/render/canvas/Instruction.js';
import {TEXT_ALIGN} from 'ol/src/render/canvas/TextBuilder.js';
import {defaultPadding} from 'ol/src/render/canvas.js';
import {setFromArray} from 'ol/src/transform.js';
import {getUid} from 'ol/src/util.js';

/**
 * If the mixin has been initialized.
 * @type {boolean}
 */
let initialized = false;

/**
 * Initialize the mixin.
 */
export const init = () => {
  if (initialized) {
    return;
  }

  initialized = true;

  /**
   * @private
   * @param {CanvasRenderingContext2D} context Context.
   * @param {ol.Transform} transform Transform.
   * @param {Object<string, boolean>} skippedFeaturesHash Ids of features to skip.
   * @param {Array<*>} instructions Instructions array.
   * @param {function((Feature|RenderFeature)): T|undefined} featureCallback Feature callback.
   * @param {ol.Extent=} opt_hitExtent Only check features that intersect this extent.
   * @return {T|undefined} Callback result.
   * @template T
   * @suppress {accessControls,unusedPrivateMembers}
   */
  Replay.prototype.replay_ = function(
      context, transform, skippedFeaturesHash,
      instructions, featureCallback, opt_hitExtent) {
    /** @type {Array<number>} */
    var pixelCoordinates;
    if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
      pixelCoordinates = this.pixelCoordinates_;
    } else {
      if (!this.pixelCoordinates_) {
        this.pixelCoordinates_ = [];
      }
      pixelCoordinates = transform2D(
          this.coordinates, 0, this.coordinates.length, 2,
          transform, this.pixelCoordinates_);
      setFromArray(this.renderedTransform_, transform);
    }
    // removed skipFeatures because that is just superfluous
    var i = 0; // instruction index
    var ii = instructions.length; // end of instructions
    var d = 0; // data index
    var dd; // end of per-instruction data
    var anchorX;
    var anchorY;
    var prevX;
    var prevY;
    var roundX;
    var roundY;
    var declutterGroup;
    var image;
    var pendingFill = 0;
    var pendingStroke = 0;
    var lastFillInstruction = null;
    var lastStrokeInstruction = null;
    var coordinateCache = this.coordinateCache_;
    var viewRotation = this.viewRotation_;

    var state = /** @type {olx.render.State} */ ({
      context: context,
      pixelRatio: this.pixelRatio,
      resolution: this.resolution,
      rotation: viewRotation
    });

    // When the batch size gets too big, performance decreases. 200 is a good
    // balance between batch size and number of fill/stroke instructions.
    var batchSize =
        this.instructions != instructions || this.overlaps ? 0 : 200;
    while (i < ii) {
      var instruction = instructions[i];
      var type = /** @type {Instruction} */ (instruction[0]);
      var /** @type {Feature|RenderFeature} */ feature;
      var x;
      var y;
      switch (type) {
        case Instruction.BEGIN_GEOMETRY:
          feature = /** @type {Feature|RenderFeature} */ (instruction[1]);
          var geom = feature.getGeometry();
          if ((skippedFeaturesHash[getUid(feature).toString()]) || !geom) {
            // edited to skip the feature callback for skipped features
            i = /** @type {number} */ (instruction[2]) + 1;
          } else if (opt_hitExtent !== undefined && !intersects(opt_hitExtent, geom.getExtent())) {
            i = /** @type {number} */ (instruction[2]) + 1;
          } else {
            ++i;
          }
          break;
        case Instruction.BEGIN_PATH:
          if (pendingFill > batchSize) {
            this.fill_(context);
            pendingFill = 0;
          }
          if (pendingStroke > batchSize) {
            context.stroke();
            pendingStroke = 0;
          }
          if (!pendingFill && !pendingStroke) {
            context.beginPath();
            prevX = prevY = NaN;
          }
          ++i;
          break;
        case Instruction.CIRCLE:
          d = /** @type {number} */ (instruction[1]);
          var x1 = pixelCoordinates[d];
          var y1 = pixelCoordinates[d + 1];
          var x2 = pixelCoordinates[d + 2];
          var y2 = pixelCoordinates[d + 3];
          var dx = x2 - x1;
          var dy = y2 - y1;
          var r = Math.sqrt(dx * dx + dy * dy);
          context.moveTo(x1 + r, y1);
          context.arc(x1, y1, r, 0, 2 * Math.PI, true);
          ++i;
          break;
        case Instruction.CLOSE_PATH:
          context.closePath();
          ++i;
          break;
        case Instruction.CUSTOM:
          d = /** @type {number} */ (instruction[1]);
          dd = instruction[2];
          var geometry = /** @type {SimpleGeometry} */ (instruction[3]);
          var renderer = instruction[4];
          var fn = instruction.length == 6 ? instruction[5] : undefined;
          state.geometry = geometry;
          state.feature = feature;
          if (!(i in coordinateCache)) {
            coordinateCache[i] = [];
          }
          var coords = coordinateCache[i];
          if (fn) {
            fn(pixelCoordinates, d, dd, 2, coords);
          } else {
            coords[0] = pixelCoordinates[d];
            coords[1] = pixelCoordinates[d + 1];
            coords.length = 2;
          }
          renderer(coords, state);
          ++i;
          break;
        case Instruction.DRAW_IMAGE:
          d = /** @type {number} */ (instruction[1]);
          dd = /** @type {number} */ (instruction[2]);
          image = /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */ (instruction[3]);
          // Remaining arguments in DRAW_IMAGE are in alphabetical order
          anchorX = /** @type {number} */ (instruction[4]);
          anchorY = /** @type {number} */ (instruction[5]);
          declutterGroup = featureCallback ? null : /** @type {ol.DeclutterGroup} */ (instruction[6]);
          var height = /** @type {number} */ (instruction[7]);
          var opacity = /** @type {number} */ (instruction[8]);
          var originX = /** @type {number} */ (instruction[9]);
          var originY = /** @type {number} */ (instruction[10]);
          var rotateWithView = /** @type {boolean} */ (instruction[11]);
          var rotation = /** @type {number} */ (instruction[12]);
          var scale = /** @type {number} */ (instruction[13]);
          var snapToPixel = /** @type {boolean} */ (instruction[14]);
          var width = /** @type {number} */ (instruction[15]);

          var padding;
          var backgroundFill;
          var backgroundStroke;
          if (instruction.length > 16) {
            padding = /** @type {Array<number>} */ (instruction[16]);
            backgroundFill = /** @type {boolean} */ (instruction[17]);
            backgroundStroke = /** @type {boolean} */ (instruction[18]);
          } else {
            padding = defaultPadding;
            backgroundFill = backgroundStroke = false;
          }

          if (rotateWithView) {
            rotation += viewRotation;
          }
          for (; d < dd; d += 2) {
            this.replayImage_(context,
                pixelCoordinates[d], pixelCoordinates[d + 1], image, anchorX, anchorY,
                declutterGroup, height, opacity, originX, originY, rotation, scale,
                snapToPixel, width, padding,
                backgroundFill ? /** @type {Array<*>} */ (lastFillInstruction) : null,
                backgroundStroke ? /** @type {Array<*>} */ (lastStrokeInstruction) : null);
          }
          this.renderDeclutter_(declutterGroup, feature);
          ++i;
          break;
        case Instruction.DRAW_CHARS:
          var begin = /** @type {number} */ (instruction[1]);
          var end = /** @type {number} */ (instruction[2]);
          var baseline = /** @type {number} */ (instruction[3]);
          declutterGroup = featureCallback ? null : /** @type {ol.DeclutterGroup} */ (instruction[4]);
          var overflow = /** @type {number} */ (instruction[5]);
          var fillKey = /** @type {string} */ (instruction[6]);
          var maxAngle = /** @type {number} */ (instruction[7]);
          var measure = /** @type {function(string):number} */ (instruction[8]);
          var offsetY = /** @type {number} */ (instruction[9]);
          var strokeKey = /** @type {string} */ (instruction[10]);
          var strokeWidth = /** @type {number} */ (instruction[11]);
          var text = /** @type {string} */ (instruction[12]);
          var textKey = /** @type {string} */ (instruction[13]);
          var textScale = /** @type {number} */ (instruction[14]);

          var pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
          var textLength = measure(text);
          if (overflow || textLength <= pathLength) {
            var textAlign = /** @type {TextReplay} */ (this).textStates[textKey].textAlign;
            var startM = (pathLength - textLength) * TEXT_ALIGN[textAlign];
            var parts = drawTextOnPath(
                pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle);
            if (parts) {
              var c;
              var cc;
              var chars;
              var label;
              var part;
              if (strokeKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = /** @type {TextReplay} */ (this).getImage(chars, textKey, '', strokeKey);
                  anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                  anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                  this.replayImage_(context,
                      /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                      anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                      /** @type {number} */ (part[3]), textScale, false, label.width,
                      defaultPadding, null, null);
                }
              }
              if (fillKey) {
                for (c = 0, cc = parts.length; c < cc; ++c) {
                  part = parts[c]; // x, y, anchorX, rotation, chunk
                  chars = /** @type {string} */ (part[4]);
                  label = /** @type {TextReplay} */ (this).getImage(chars, textKey, fillKey, '');
                  anchorX = /** @type {number} */ (part[2]);
                  anchorY = baseline * label.height - offsetY;
                  this.replayImage_(context,
                      /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                      anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                      /** @type {number} */ (part[3]), textScale, false, label.width,
                      defaultPadding, null, null);
                }
              }
            }
          }
          this.renderDeclutter_(declutterGroup, feature);
          ++i;
          break;
        case Instruction.END_GEOMETRY:
          if (featureCallback !== undefined) {
            feature = /** @type {Feature|RenderFeature} */ (instruction[1]);
            var result = featureCallback(feature);
            if (result) {
              return result;
            }
          }
          ++i;
          break;
        case Instruction.FILL:
          if (batchSize) {
            pendingFill++;
          } else {
            this.fill_(context);
          }
          ++i;
          break;
        case Instruction.MOVE_TO_LINE_TO:
          d = /** @type {number} */ (instruction[1]);
          dd = /** @type {number} */ (instruction[2]);
          x = pixelCoordinates[d];
          y = pixelCoordinates[d + 1];
          roundX = (x + 0.5) | 0;
          roundY = (y + 0.5) | 0;
          if (roundX !== prevX || roundY !== prevY) {
            context.moveTo(x, y);
            prevX = roundX;
            prevY = roundY;
          }
          for (d += 2; d < dd; d += 2) {
            x = pixelCoordinates[d];
            y = pixelCoordinates[d + 1];
            roundX = (x + 0.5) | 0;
            roundY = (y + 0.5) | 0;
            if (d == dd - 2 || roundX !== prevX || roundY !== prevY) {
              context.lineTo(x, y);
              prevX = roundX;
              prevY = roundY;
            }
          }
          ++i;
          break;
        case Instruction.SET_FILL_STYLE:
          lastFillInstruction = instruction;
          this.fillOrigin_ = instruction[2];

          if (pendingFill) {
            this.fill_(context);
            pendingFill = 0;
            if (pendingStroke) {
              context.stroke();
              pendingStroke = 0;
            }
          }

          context.fillStyle = /** @type {ol.ColorLike} */ (instruction[1]);
          ++i;
          break;
        case Instruction.SET_STROKE_STYLE:
          lastStrokeInstruction = instruction;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
          this.setStrokeStyle_(context, /** @type {Array<*>} */ (instruction));
          ++i;
          break;
        case Instruction.STROKE:
          if (batchSize) {
            pendingStroke++;
          } else {
            context.stroke();
          }
          ++i;
          break;
        default:
          ++i; // consume the instruction anyway, to avoid an infinite loop
          break;
      }
    }
    if (pendingFill) {
      this.fill_(context);
    }
    if (pendingStroke) {
      context.stroke();
    }
    return undefined;
  };
};

init();
