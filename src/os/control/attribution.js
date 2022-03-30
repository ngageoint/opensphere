goog.declareModuleId('os.control.Attribution');

import {equals} from 'ol/src/array.js';
import OLAttribution from 'ol/src/control/Attribution.js';

const dom = goog.require('goog.dom');
const SafeHtml = goog.require('goog.html.SafeHtml');


/**
 */
export default class Attribution extends OLAttribution {
  /**
   * Constructor.
   * @param {olx.control.AttributionOptions=} opt_options Attribution options.
   */
  constructor(opt_options) {
    super(opt_options);
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  collectSourceAttributions_(frameState) {
    /**
     * Used to determine if an attribution already exists.
     * @type {Object<string, boolean>}
     */
    var lookup = {};

    /**
     * A list of visible attributions.
     * @type {Array<string>}
     */
    var visibleAttributions = [];

    var layerStatesArray = frameState.layerStatesArray;
    var resolution = frameState.viewState.resolution;
    for (var i = 0, ii = layerStatesArray.length; i < ii; ++i) {
      var layerState = layerStatesArray[i];
      if (checkVisibleAtResolution) {
        if (!visibleAtResolution(layerState, resolution)) {
          continue;
        }
      }

      var source = layerState.layer.getSource();
      if (!source) {
        continue;
      }

      var attributionGetter = source.getAttributions();
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
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  updateElement_(frameState) {
    if (!frameState) {
      if (this.renderedVisible_) {
        this.element.style.display = 'none';
        this.renderedVisible_ = false;
      }
      return;
    }

    var attributions = this.collectSourceAttributions_(frameState);
    if (equals(attributions, this.renderedAttributions_)) {
      return;
    }

    // remove everything
    dom.removeChildren(this.ulElement_);

    // add the label
    var label;
    if (attributions.length > 1) {
      label = SafeHtml.create('li', undefined, 'Sources:');
    } else {
      label = SafeHtml.create('li', undefined, 'Source:');
    }

    dom.appendChild(this.ulElement_, dom.safeHtmlToNode(label));

    // append the attributions
    for (var i = 0, ii = attributions.length; i < ii; ++i) {
      label = SafeHtml.create('li', undefined, attributions[i]);
      dom.appendChild(this.ulElement_, dom.safeHtmlToNode(label));
    }

    var visible = attributions.length > 0;
    if (this.renderedVisible_ != visible) {
      this.element.style.display = visible ? '' : 'none';
      this.renderedVisible_ = visible;
    }

    this.renderedAttributions_ = attributions;

    dom.removeNode(this.toggleButton_);
  }
}

/**
 * Replaces `ol.layer.Layer.visibleAtResolution` because Openlayers only checks the layerState for visibility. This does
 * not work when using a WebGL renderer.
 *
 * @param {ol.LayerState} layerState Layer state.
 * @param {number} resolution Resolution.
 * @return {boolean} The layer is visible at the given resolution.
 */
const visibleAtResolution = (layerState, resolution) => {
  return layerState.layer.getVisible() && resolution >= layerState.minResolution &&
      resolution < layerState.maxResolution;
};

/**
 * Whether to check if a layer is visible at the current resolution before adding to attribution.
 *
 * If true, the layer attribution will be added only if the layer would be shown. If false,
 * the layer attribution will not be resolution sensitive.
 *
 * @type {boolean}
 */
const checkVisibleAtResolution = true;

/**
 * Disable this behavior from OpenLayers.
 * @suppress {accessControls}
 */
OLAttribution.prototype.insertLogos_ = () => {};
