/**
 * @fileoverview Restores style properties removed from {@link Base} in OL3 commit
 *               d6f03697d7673ed57decdf92cb5d37f03a1f5323.
 * @see http://git.stwan.bits/projects/OSS/repos/ol3/commits/d6f03697d7673ed57decdf92cb5d37f03a1f5323#src/ol/layer/layerbase.js
 */
goog.declareModuleId('os.mixin.layerbase');

import Base from 'ol/src/layer/Base.js';
import Property from 'ol/src/layer/Property.js';


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
   * @type {string}
   */
  Property.BRIGHTNESS = 'brightness';


  /**
   * @type {string}
   */
  Property.CONTRAST = 'contrast';


  /**
   * @type {string}
   */
  Property.HUE = 'hue';


  /**
   * @type {string}
   */
  Property.SATURATION = 'saturation';


  /**
   * @type {string}
   */
  Property.SHARPNESS = 'sharpness';


  /**
   * Return the brightness of the layer.
   *
   * @return {number} The brightness of the layer.
   */
  Base.prototype.getBrightness = function() {
    return /** @type {number} */ (this.get(Property.BRIGHTNESS));
  };


  /**
   * Return the contrast of the layer.
   *
   * @return {number} The contrast of the layer.
   */
  Base.prototype.getContrast = function() {
    return /** @type {number} */ (this.get(Property.CONTRAST));
  };


  /**
   * Return the hue of the layer.
   *
   * @return {number} The hue of the layer.
   */
  Base.prototype.getHue = function() {
    return /** @type {number} */ (this.get(Property.HUE));
  };


  /**
   * Return the saturation of the layer.
   *
   * @return {number} The saturation of the layer.
   */
  Base.prototype.getSaturation = function() {
    return /** @type {number} */ (this.get(Property.SATURATION));
  };


  /**
   * Return the sharpness of the layer.
   *
   * @return {number} The sharpness of the layer.
   */
  Base.prototype.getSharpness = function() {
    return /** @type {number} */ (this.get(Property.SHARPNESS));
  };


  /**
   * Adjust the layer brightness.  A value of -1 will render the layer completely
   * black.  A value of 0 will leave the brightness unchanged.  A value of 1 will
   * render the layer completely white.  Other values are linear multipliers on
   * the effect (values are clamped between -1 and 1).
   *
   * The filter effects draft [1] says the brightness function is supposed to
   * render 0 black, 1 unchanged, and all other values as a linear multiplier.
   *
   * The current WebKit implementation clamps values between -1 (black) and 1
   * (white) [2].  There is a bug open to change the filter effect spec [3].
   *
   * TODO: revisit this if the spec is still unmodified before we release
   *
   * [1] https://dvcs.w3.org/hg/FXTF/raw-file/tip/filters/index.html
   * [2] https://github.com/WebKit/webkit/commit/8f4765e569
   * [3] https://www.w3.org/Bugs/Public/show_bug.cgi?id=15647
   *
   * @param {number} brightness The brightness of the layer.
   */
  Base.prototype.setBrightness = function(brightness) {
    this.set(Property.BRIGHTNESS, brightness);
  };


  /**
   * Adjust the layer contrast.  A value of 0 will render the layer completely
   * grey.  A value of 1 will leave the contrast unchanged.  Other values are
   * linear multipliers on the effect (and values over 1 are permitted).
   *
   * @param {number} contrast The contrast of the layer.
   */
  Base.prototype.setContrast = function(contrast) {
    this.set(Property.CONTRAST, contrast);
  };


  /**
   * Adjust the layer hue.  A value of 0 will render the layer completely
   * grey.  A value of 1 will leave the hue unchanged.  Other values are
   * linear multipliers on the effect (and values over 1 are permitted).
   *
   * @param {number} hue The hue of the layer.
   */
  Base.prototype.setHue = function(hue) {
    this.set(Property.HUE, hue);
  };


  /**
   * Adjust layer saturation.  A value of 0 will render the layer completely
   * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
   * values are linear multipliers of the effect (and values over 1 are
   * permitted).
   *
   * @param {number} saturation The saturation of the layer.
   */
  Base.prototype.setSaturation = function(saturation) {
    this.set(Property.SATURATION, saturation);
  };


  /**
   * Adjust layer sharpness. A value of 0 will not adjust layer sharpness.
   *
   * @param {number} sharpness The sharpness of the layer.
   */
  Base.prototype.setSharpness = function(sharpness) {
    this.set(Property.SHARPNESS, sharpness);
  };
};

init();
