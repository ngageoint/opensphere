/* eslint-disable */
// eslint is disabled here because we want to be able to diff this function more
// exactly with the original from openlayers

goog.provide('os.mixin.canvasreplay');

goog.require('ol.render.canvas.Replay');

/**
 * @private
 * @param {CanvasRenderingContext2D} context Context.
 * @param {ol.Transform} transform Transform.
 * @param {Object.<string, boolean>} skippedFeaturesHash Ids of features
 *     to skip.
 * @param {Array.<*>} instructions Instructions array.
 * @param {function((ol.Feature|ol.render.Feature)): T|undefined}
 *     featureCallback Feature callback.
 * @param {ol.Extent=} opt_hitExtent Only check features that intersect this
 *     extent.
 * @return {T|undefined} Callback result.
 * @template T
 * @suppress {accessControls,unusedPrivateMembers}
 */
ol.render.canvas.Replay.prototype.replay_ = function(
    context, transform, skippedFeaturesHash,
    instructions, featureCallback, opt_hitExtent) {
  /** @type {Array.<number>} */
  var pixelCoordinates;
  if (this.pixelCoordinates_ && ol.array.equals(transform, this.renderedTransform_)) {
    pixelCoordinates = this.pixelCoordinates_;
  } else {
    if (!this.pixelCoordinates_) {
      this.pixelCoordinates_ = [];
    }
    pixelCoordinates = ol.geom.flat.transform.transform2D(
        this.coordinates, 0, this.coordinates.length, 2,
        transform, this.pixelCoordinates_);
    ol.transform.setFromArray(this.renderedTransform_, transform);
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
    var type = /** @type {ol.render.canvas.Instruction} */ (instruction[0]);
    var /** @type {ol.Feature|ol.render.Feature} */ feature;
    var x;
    var y;
    switch (type) {
      case ol.render.canvas.Instruction.BEGIN_GEOMETRY:
        feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
        var geom = feature.getGeometry();
        if ((skippedFeaturesHash[ol.getUid(feature).toString()]) || !geom) {
          // edited to skip the feature callback for skipped features
          i = /** @type {number} */ (instruction[2]) + 1;
        } else if (opt_hitExtent !== undefined && !ol.extent.intersects(
            opt_hitExtent, geom.getExtent())) {
          i = /** @type {number} */ (instruction[2]) + 1;
        } else {
          ++i;
        }
        break;
      case ol.render.canvas.Instruction.BEGIN_PATH:
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
      case ol.render.canvas.Instruction.CIRCLE:
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
      case ol.render.canvas.Instruction.CLOSE_PATH:
        context.closePath();
        ++i;
        break;
      case ol.render.canvas.Instruction.CUSTOM:
        d = /** @type {number} */ (instruction[1]);
        dd = instruction[2];
        var geometry = /** @type {ol.geom.SimpleGeometry} */ (instruction[3]);
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
      case ol.render.canvas.Instruction.DRAW_IMAGE:
        d = /** @type {number} */ (instruction[1]);
        dd = /** @type {number} */ (instruction[2]);
        image =  /** @type {HTMLCanvasElement|HTMLVideoElement|Image} */
            (instruction[3]);
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

        var padding, backgroundFill, backgroundStroke;
        if (instruction.length > 16) {
          padding = /** @type {Array.<number>} */ (instruction[16]);
          backgroundFill = /** @type {boolean} */ (instruction[17]);
          backgroundStroke = /** @type {boolean} */ (instruction[18]);
        } else {
          padding = ol.render.canvas.defaultPadding;
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
              backgroundFill ? /** @type {Array.<*>} */ (lastFillInstruction) : null,
              backgroundStroke ? /** @type {Array.<*>} */ (lastStrokeInstruction) : null);
        }
        this.renderDeclutter_(declutterGroup, feature);
        ++i;
        break;
      case ol.render.canvas.Instruction.DRAW_CHARS:
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
        var strokeWidth =  /** @type {number} */ (instruction[11]);
        var text = /** @type {string} */ (instruction[12]);
        var textKey = /** @type {string} */ (instruction[13]);
        var textScale = /** @type {number} */ (instruction[14]);

        var pathLength = ol.geom.flat.length.lineString(pixelCoordinates, begin, end, 2);
        var textLength = measure(text);
        if (overflow || textLength <= pathLength) {
          var textAlign = /** @type {ol.render.canvas.TextReplay} */ (this).textStates[textKey].textAlign;
          var startM = (pathLength - textLength) * ol.render.replay.TEXT_ALIGN[textAlign];
          var parts = ol.geom.flat.textpath.lineString(
              pixelCoordinates, begin, end, 2, text, measure, startM, maxAngle);
          if (parts) {
            var c, cc, chars, label, part;
            if (strokeKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, textKey, '', strokeKey);
                anchorX = /** @type {number} */ (part[2]) + strokeWidth;
                anchorY = baseline * label.height + (0.5 - baseline) * 2 * strokeWidth - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width,
                    ol.render.canvas.defaultPadding, null, null);
              }
            }
            if (fillKey) {
              for (c = 0, cc = parts.length; c < cc; ++c) {
                part = parts[c]; // x, y, anchorX, rotation, chunk
                chars = /** @type {string} */ (part[4]);
                label = /** @type {ol.render.canvas.TextReplay} */ (this).getImage(chars, textKey, fillKey, '');
                anchorX = /** @type {number} */ (part[2]);
                anchorY = baseline * label.height - offsetY;
                this.replayImage_(context,
                    /** @type {number} */ (part[0]), /** @type {number} */ (part[1]), label,
                    anchorX, anchorY, declutterGroup, label.height, 1, 0, 0,
                    /** @type {number} */ (part[3]), textScale, false, label.width,
                    ol.render.canvas.defaultPadding, null, null);
              }
            }
          }
        }
        this.renderDeclutter_(declutterGroup, feature);
        ++i;
        break;
      case ol.render.canvas.Instruction.END_GEOMETRY:
        if (featureCallback !== undefined) {
          feature = /** @type {ol.Feature|ol.render.Feature} */ (instruction[1]);
          var result = featureCallback(feature);
          if (result) {
            return result;
          }
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.FILL:
        if (batchSize) {
          pendingFill++;
        } else {
          this.fill_(context);
        }
        ++i;
        break;
      case ol.render.canvas.Instruction.MOVE_TO_LINE_TO:
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
      case ol.render.canvas.Instruction.SET_FILL_STYLE:
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
      case ol.render.canvas.Instruction.SET_STROKE_STYLE:
        lastStrokeInstruction = instruction;
        if (pendingStroke) {
          context.stroke();
          pendingStroke = 0;
        }
        this.setStrokeStyle_(context, /** @type {Array.<*>} */ (instruction));
        ++i;
        break;
      case ol.render.canvas.Instruction.STROKE:
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
