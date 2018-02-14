goog.provide('os.control.Attribution');

goog.require('goog.dom.safe');
goog.require('goog.html.SafeHtml');
goog.require('ol.control.Attribution');

/**
 * @constructor
 * @extends {ol.control.Attribution}
 * @param {olx.control.AttributionOptions=} opt_options Attribution options.
 */
os.control.Attribution = function(opt_options) {
  os.control.Attribution.base(this, 'constructor', opt_options);
};
goog.inherits(os.control.Attribution, ol.control.Attribution);

/**
 * Whether to check if a layer is visible at the current resolution before adding to attribution.
 *
 * If true, the layer attribution will be added only if the layer would be shown. If false,
 * the layer attribution will not be resolution sensitive.
 *
 * @type {boolean}
 */
os.control.Attribution.CheckVisibleAtResolution = true;

/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.control.Attribution.prototype.getSourceAttributions_ = function(frameState) {
  /**
   * Used to determine if an attribution already exists.
   * @type {Object.<string, boolean>}
   */
  var lookup = {};

  /**
   * A list of visible attributions.
   * @type {Array.<string>}
   */
  var visibleAttributions = [];

  var layerStatesArray = frameState.layerStatesArray;
  var resolution = frameState.viewState.resolution;
  for (var i = 0, ii = layerStatesArray.length; i < ii; ++i) {
    var layerState = layerStatesArray[i];
    if (os.control.Attribution.CheckVisibleAtResolution) {
      if (!os.control.Attribution.visibleAtResolution(layerState, resolution)) {
        continue;
      }
    }

    var source = layerState.layer.getSource();
    if (!source) {
      continue;
    }

    var attributionGetter = source.getAttributions2();
    if (!attributionGetter) {
      continue;
    }

    var attributions = attributionGetter(frameState);
    if (!attributions) {
      continue;
    }

    if (Array.isArray(attributions)) {
      for (var j = 0, jj = attributions.length; j < jj; ++j) {
        if (!(attributions[j] in lookup)) {
          visibleAttributions.push(attributions[j]);
          lookup[attributions[j]] = true;
        }
      }
    } else if (!(attributions in lookup)) {
      visibleAttributions.push(attributions);
      lookup[attributions] = true;
    }
  }
  return visibleAttributions;
};

/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.control.Attribution.prototype.updateElement_ = function(frameState) {
  if (!frameState) {
    if (this.renderedVisible_) {
      this.element.style.display = 'none';
      this.renderedVisible_ = false;
    }
    return;
  }

  var attributions = this.getSourceAttributions_(frameState);
  if (ol.array.equals(attributions, this.renderedAttributions_)) {
    return;
  }

  // remove everything
  goog.dom.removeChildren(this.ulElement_);

  // add the label
  var label;
  if (attributions.length > 1) {
    label = goog.html.SafeHtml.create('li', undefined, 'Sources:');
  } else {
    label = goog.html.SafeHtml.create('li', undefined, 'Source:');
  }

  goog.dom.appendChild(this.ulElement_, goog.dom.safeHtmlToNode(label));

  // append the attributions
  for (var i = 0, ii = attributions.length; i < ii; ++i) {
    label = goog.html.SafeHtml.create('li', undefined, attributions[i]);
    goog.dom.appendChild(this.ulElement_, goog.dom.safeHtmlToNode(label));
  }

  var visible = attributions.length > 0;
  if (this.renderedVisible_ != visible) {
    this.element.style.display = visible ? '' : 'none';
    this.renderedVisible_ = visible;
  }

  this.renderedAttributions_ = attributions;
};

/**
 * @suppress {accessControls}
 */
ol.control.Attribution.prototype.insertLogos_ = goog.nullFunction;


/**
 * Replaces `ol.layer.Layer.visibleAtResolution` because Openlayers only checks the layerState for visibility. This does
 * not work when Cesium is up.
 *
 * @param {ol.LayerState} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
os.control.Attribution.visibleAtResolution = function(layerState, resolution) {
  return layerState.layer.getVisible() && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
};
