goog.declareModuleId('os.mixin.canvasexecutor');

import {equals} from 'ol/src/array.js';
import {intersects} from 'ol/src/extent.js';
import Feature from 'ol/src/Feature.js';
import {lineStringLength} from 'ol/src/geom/flat/length.js';
import {drawTextOnPath} from 'ol/src/geom/flat/textpath.js';
import {transform2D} from 'ol/src/geom/flat/transform.js';
import Executor from 'ol/src/render/canvas/Executor.js';
import CanvasInstruction from 'ol/src/render/canvas/Instruction.js';
import {TEXT_ALIGN} from 'ol/src/render/canvas/TextBuilder.js';
import {
  defaultPadding,
  measureAndCacheTextWidth
} from 'ol/src/render/canvas.js';
import {
  setFromArray as transformSetFromArray
} from 'ol/src/transform.js';

import MapContainer from '../mapcontainer.js';

/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {number} contextScale Scale of the context.
 * @param {import("../../transform.js").Transform} transform Transform.
 * @param {Array<*>} instructions Instructions array.
 * @param {boolean} snapToPixel Snap point symbols and text to integer pixels.
 * @param {FeatureCallback<T>} [opt_featureCallback] Feature callback.
 * @param {import("../../extent.js").Extent} [opt_hitExtent] Only check
 *     features that intersect this extent.
 * @param {import("rbush").default} [opt_declutterTree] Declutter tree.
 * @return {T|undefined} Callback result.
 * @template T
 */
Executor.prototype.execute_ = function(
    context,
    contextScale,
    transform,
    instructions,
    snapToPixel,
    opt_featureCallback,
    opt_hitExtent,
    opt_declutterTree
) {
  if (MapContainer.getInstance().is3DEnabled()) {
    return undefined;
  }

  /** @type {Array<number>} */
  let pixelCoordinates;
  if (this.pixelCoordinates_ && equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = transform2D(
        this.coordinates,
        0,
        this.coordinates.length,
        2,
        transform,
        this.pixelCoordinates_
    );
    transformSetFromArray(this.renderedTransform_, transform);
  }
  let i = 0; // instruction index
  const ii = instructions.length; // end of instructions
  let d = 0; // data index
  let dd; // end of per-instruction data
  let anchorX;
  let anchorY;
  let prevX;
  let prevY;
  let roundX;
  let roundY;
  let image;
  let text;
  let textKey;
  let strokeKey;
  let fillKey;
  let pendingFill = 0;
  let pendingStroke = 0;
  let lastFillInstruction = null;
  let lastStrokeInstruction = null;
  const coordinateCache = this.coordinateCache_;
  const viewRotation = this.viewRotation_;
  const viewRotationFromTransform =
    Math.round(Math.atan2(-transform[1], transform[0]) * 1e12) / 1e12;

  const state = /** @type {import("../../render.js").State} */ ({
    context: context,
    pixelRatio: this.pixelRatio,
    resolution: this.resolution,
    rotation: viewRotation
  });

  // When the batch size gets too big, performance decreases. 200 is a good
  // balance between batch size and number of fill/stroke instructions.
  const batchSize =
    this.instructions != instructions || this.overlaps ? 0 : 200;
  let /** @type {import("../../Feature.js").FeatureLike} */ feature;
  let x;
  let y;
  let currentGeometry;
  while (i < ii) {
    const instruction = instructions[i];
    const type = /** @type {import("./Instruction.js").default} */ (
      instruction[0]
    );
    switch (type) {
      case CanvasInstruction.BEGIN_GEOMETRY:
        feature = /** @type {import("../../Feature.js").FeatureLike} */ (
          instruction[1]
        );
        currentGeometry = instruction[3];
        if (!feature.getGeometry()) {
          i = /** @type {number} */ (instruction[2]);
        } else if (
          opt_hitExtent !== undefined &&
          !intersects(opt_hitExtent, currentGeometry.getExtent())
        ) {
          i = /** @type {number} */ (instruction[2]) + 1;
        } else {
          ++i;
        }
        break;
      case CanvasInstruction.BEGIN_PATH:
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
          prevX = NaN;
          prevY = NaN;
        }
        ++i;
        break;
      case CanvasInstruction.CIRCLE:
        d = /** @type {number} */ (instruction[1]);
        const x1 = pixelCoordinates[d];
        const y1 = pixelCoordinates[d + 1];
        const x2 = pixelCoordinates[d + 2];
        const y2 = pixelCoordinates[d + 3];
        const dx = x2 - x1;
        const dy = y2 - y1;
        const r = Math.sqrt(dx * dx + dy * dy);
        context.moveTo(x1 + r, y1);
        context.arc(x1, y1, r, 0, 2 * Math.PI, true);
        ++i;
        break;
      case CanvasInstruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case CanvasInstruction.CUSTOM:
        d = /** @type {number} */ (instruction[1]);
        dd = instruction[2];
        const geometry =
          /** @type {import("../../geom/SimpleGeometry.js").default} */ (
            instruction[3]
          );
        const renderer = instruction[4];
        const fn = instruction.length == 6 ? instruction[5] : undefined;
        state.geometry = geometry;
        state.feature = feature;
        if (!(i in coordinateCache)) {
          coordinateCache[i] = [];
        }
        const coords = coordinateCache[i];
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
      case CanvasInstruction.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        image =
          /** @type {HTMLCanvasElement|HTMLVideoElement|HTMLImageElement} */ (
            instruction[3]
          );

        // Remaining arguments in DRAW_IMAGE are in alphabetical order
        anchorX = /** @type {number} */ (instruction[4]);
        anchorY = /** @type {number} */ (instruction[5]);
        let height = /** @type {number} */ (instruction[6]);
        const opacity = /** @type {number} */ (instruction[7]);
        const originX = /** @type {number} */ (instruction[8]);
        const originY = /** @type {number} */ (instruction[9]);
        const rotateWithView = /** @type {boolean} */ (instruction[10]);
        let rotation = /** @type {number} */ (instruction[11]);
        const scale = /** @type {import("../../size.js").Size} */ (
          instruction[12]
        );
        let width = /** @type {number} */ (instruction[13]);
        const declutterImageWithText =
          /** @type {import("../canvas.js").DeclutterImageWithText} */ (
            instruction[14]
          );

        if (!image && instruction.length >= 19) {
          // create label images
          text = /** @type {string} */ (instruction[18]);
          textKey = /** @type {string} */ (instruction[19]);
          strokeKey = /** @type {string} */ (instruction[20]);
          fillKey = /** @type {string} */ (instruction[21]);
          const labelWithAnchor = this.drawLabelWithPointPlacement_(
              text,
              textKey,
              strokeKey,
              fillKey
          );
          image = labelWithAnchor.label;
          instruction[3] = image;
          const textOffsetX = /** @type {number} */ (instruction[22]);
          anchorX = (labelWithAnchor.anchorX - textOffsetX) * this.pixelRatio;
          instruction[4] = anchorX;
          const textOffsetY = /** @type {number} */ (instruction[23]);
          anchorY = (labelWithAnchor.anchorY - textOffsetY) * this.pixelRatio;
          instruction[5] = anchorY;
          height = image.height;
          instruction[6] = height;
          width = image.width;
          instruction[13] = width;
        }

        let geometryWidths;
        if (instruction.length > 24) {
          geometryWidths = /** @type {number} */ (instruction[24]);
        }

        let padding;
        let backgroundFill;
        let backgroundStroke;
        if (instruction.length > 16) {
          padding = /** @type {Array<number>} */ (instruction[15]);
          backgroundFill = /** @type {boolean} */ (instruction[16]);
          backgroundStroke = /** @type {boolean} */ (instruction[17]);
        } else {
          padding = defaultPadding;
          backgroundFill = false;
          backgroundStroke = false;
        }

        if (rotateWithView && viewRotationFromTransform) {
          // Canvas is expected to be rotated to reverse view rotation.
          rotation += viewRotation;
        } else if (!rotateWithView && !viewRotationFromTransform) {
          // Canvas is not rotated, images need to be rotated back to be north-up.
          rotation -= viewRotation;
        }
        let widthIndex = 0;
        for (; d < dd; d += 2) {
          if (
            geometryWidths &&
            geometryWidths[widthIndex++] < width / this.pixelRatio
          ) {
            continue;
          }
          const dimensions = this.calculateImageOrLabelDimensions_(
              image.width,
              image.height,
              pixelCoordinates[d],
              pixelCoordinates[d + 1],
              width,
              height,
              anchorX,
              anchorY,
              originX,
              originY,
              rotation,
              scale,
              snapToPixel,
              padding,
              backgroundFill || backgroundStroke,
              feature
          );
          /** @type {ReplayImageOrLabelArgs} */
          const args = [
            context,
            contextScale,
            image,
            dimensions,
            opacity,
            backgroundFill ? /** @type {Array<*>} */ (lastFillInstruction) : null,
            backgroundStroke ? /** @type {Array<*>} */ (lastStrokeInstruction) : null
          ];
          let imageArgs;
          let imageDeclutterBox;
          if (opt_declutterTree && declutterImageWithText) {
            const index = dd - d;
            if (!declutterImageWithText[index]) {
              // We now have the image for an image+text combination.
              declutterImageWithText[index] = args;
              // Don't render anything for now, wait for the text.
              continue;
            }
            imageArgs = declutterImageWithText[index];
            delete declutterImageWithText[index];
            imageDeclutterBox = getDeclutterBox(imageArgs);
            if (opt_declutterTree.collides(imageDeclutterBox)) {
              continue;
            }
          }
          if (
            opt_declutterTree &&
            opt_declutterTree.collides(dimensions.declutterBox)
          ) {
            continue;
          }
          if (imageArgs) {
            // We now have image and text for an image+text combination.
            if (opt_declutterTree) {
              opt_declutterTree.insert(imageDeclutterBox);
            }
            // Render the image before we render the text.
            this.replayImageOrLabel_.apply(this, imageArgs);
          }
          if (opt_declutterTree) {
            opt_declutterTree.insert(dimensions.declutterBox);
          }
          this.replayImageOrLabel_.apply(this, args);
        }
        ++i;
        break;
      case CanvasInstruction.DRAW_CHARS:
        const begin = /** @type {number} */ (instruction[1]);
        const end = /** @type {number} */ (instruction[2]);
        const baseline = /** @type {number} */ (instruction[3]);
        const overflow = /** @type {number} */ (instruction[4]);
        fillKey = /** @type {string} */ (instruction[5]);
        const maxAngle = /** @type {number} */ (instruction[6]);
        const measurePixelRatio = /** @type {number} */ (instruction[7]);
        const offsetY = /** @type {number} */ (instruction[8]);
        strokeKey = /** @type {string} */ (instruction[9]);
        const strokeWidth = /** @type {number} */ (instruction[10]);
        text = /** @type {string} */ (instruction[11]);
        textKey = /** @type {string} */ (instruction[12]);
        const pixelRatioScale = [
          /** @type {number} */ (instruction[13]),
          /** @type {number} */ (instruction[13])
        ];

        const textState = this.textStates[textKey];
        const font = textState.font;
        const textScale = [
          textState.scale[0] * measurePixelRatio,
          textState.scale[1] * measurePixelRatio
        ];

        let cachedWidths;
        if (font in this.widths_) {
          cachedWidths = this.widths_[font];
        } else {
          cachedWidths = {};
          this.widths_[font] = cachedWidths;
        }

        const pathLength = lineStringLength(pixelCoordinates, begin, end, 2);
        const textLength =
          Math.abs(textScale[0]) *
          measureAndCacheTextWidth(font, text, cachedWidths);
        if (overflow || textLength <= pathLength) {
          const textAlign = this.textStates[textKey].textAlign;
          const startM = (pathLength - textLength) * TEXT_ALIGN[textAlign];
          const parts = drawTextOnPath(
              pixelCoordinates,
              begin,
              end,
              2,
              text,
              startM,
              maxAngle,
              Math.abs(textScale[0]),
              measureAndCacheTextWidth,
              font,
              cachedWidths,
              viewRotationFromTransform ? 0 : this.viewRotation_
          );
          drawChars: if (parts) {
            /** @type {Array<ReplayImageOrLabelArgs>} */
            const replayImageOrLabelArgs = [];
            let c;
            let cc;
            let chars;
            let label;
            let part;
            if (strokeKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = this.createLabel(chars, textKey, '', strokeKey);
                anchorX =
                  /** @type {number} */ (part[2]) +
                  (textScale[0] < 0 ? -strokeWidth : strokeWidth);
                anchorY =
                  baseline * label.height +
                  ((0.5 - baseline) * 2 * strokeWidth * textScale[1]) /
                    textScale[0] -
                  offsetY;
                const dimensions = this.calculateImageOrLabelDimensions_(
                    label.width,
                    label.height,
                    part[0],
                    part[1],
                    label.width,
                    label.height,
                    anchorX,
                    anchorY,
                    0,
                    0,
                    part[3],
                    pixelRatioScale,
                    false,
                    defaultPadding,
                    false,
                    feature
                );
                if (
                  opt_declutterTree &&
                  opt_declutterTree.collides(dimensions.declutterBox)
                ) {
                  break drawChars;
                }
                replayImageOrLabelArgs.push([
                  context,
                  contextScale,
                  label,
                  dimensions,
                  1,
                  null,
                  null
                ]);
              }
            }
            if (fillKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = this.createLabel(chars, textKey, fillKey, '');
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                const dimensions = this.calculateImageOrLabelDimensions_(
                    label.width,
                    label.height,
                    part[0],
                    part[1],
                    label.width,
                    label.height,
                    anchorX,
                    anchorY,
                    0,
                    0,
                    part[3],
                    pixelRatioScale,
                    false,
                    defaultPadding,
                    false,
                    feature
                );
                if (
                  opt_declutterTree &&
                  opt_declutterTree.collides(dimensions.declutterBox)
                ) {
                  break drawChars;
                }
                replayImageOrLabelArgs.push([
                  context,
                  contextScale,
                  label,
                  dimensions,
                  1,
                  null,
                  null
                ]);
              }
            }
            if (opt_declutterTree) {
              opt_declutterTree.load(
                  replayImageOrLabelArgs.map(getDeclutterBox)
              );
            }
            for (let i = 0, ii = replayImageOrLabelArgs.length; i < ii; ++i) {
              this.replayImageOrLabel_.apply(this, replayImageOrLabelArgs[i]);
            }
          }
        }
        ++i;
        break;
      case CanvasInstruction.END_GEOMETRY:
        if (opt_featureCallback !== undefined) {
          for (let j = i; j >= 0; j--) {
            if (Array.isArray(instructions[j] && instructions[j].length > 2 && instructions[j][1] instanceof Feature)) {
              feature = instructions[j][1];
              break;
            }
          }
          const result = opt_featureCallback(feature, currentGeometry);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case CanvasInstruction.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context);
        }
        ++i;
        break;
      case CanvasInstruction.MOVE_TO_LINE_TO:
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
      case CanvasInstruction.SET_FILL_STYLE:
        lastFillInstruction = instruction;
        this.alignFill_ = instruction[2];

        if (pendingFill) {
          this.fill_(context);
          pendingFill = 0;
          if (pendingStroke) {
            context.stroke();
            pendingStroke = 0;
          }
        }

        context.fillStyle =
          /** @type {import("../../colorlike.js").ColorLike} */ (
            instruction[1]
          );
        ++i;
        break;
      case CanvasInstruction.SET_STROKE_STYLE:
        lastStrokeInstruction = instruction;
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        this.setStrokeStyle_(context, /** @type {Array<*>} */ (instruction));
        ++i;
        break;
      case CanvasInstruction.STROKE:
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
