goog.declareModuleId('os.style.Icon');

import IconStyle from 'ol/src/style/Icon.js';
import '../mixin/iconimagemixin.js';
import {toRgbArray} from '../color.js';

/**
 * This is to handle icon styles like Google Earth. Google Earth (and also Maps) normalizes the minimum dimension
 * to 32px at scale 1.0 (16px at 0.5, 64px at 2.0, etc.).
 */
export default class Icon extends IconStyle {
  /**
   * Constructor.
   * @param {olx.style.IconOptions=} opt_options Options.
   */
  constructor(opt_options) {
    var options = opt_options || {};

    // if an opacity wasn't provided, get it from the color
    if (options.opacity == null && options.color != null) {
      var colorArr = toRgbArray(options.color);
      if (colorArr && typeof colorArr[3] == 'number' && !isNaN(colorArr[3])) {
        options.opacity = /** @type {number} */ (colorArr[3]);
      }
    }

    super(options);

    /**
     * @type {number}
     * @private
     */
    this.normalizedScale_ = 0;
  }

  /**
   * @param {ol.Size} size
   * @suppress {accessControls}
   */
  setSize(size) {
    this.normalizedScale_ = 0;
    this.normalizedAnchor_ = null;
    this.size_ = size;
  }

  /**
   * @inheritDoc
   */
  getScale() {
    if (this.normalizedScale_) {
      return this.normalizedScale_;
    } else {
      var size = this.getSize();
      var scale = super.getScale();

      if (size) {
        this.normalizedScale_ = scale = 32 * scale / Math.min(size[0], size[1]);
      }
    }

    return scale;
  }

  /**
   * Get the base image for the icon. This is necessary to check if the image has been loaded.
   *
   * @return {Image|HTMLCanvasElement} Image.
   * @suppress {accessControls}
   */
  getBaseImage() {
    return this.iconImage_.image_;
  }
}
