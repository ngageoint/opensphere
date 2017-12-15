/**
 * @fileoverview Restores style properties removed from {@link ol.layer.Base} in OL3 commit
 *               d6f03697d7673ed57decdf92cb5d37f03a1f5323.
 * @see http://git.stwan.bits/projects/OSS/repos/ol3/commits/d6f03697d7673ed57decdf92cb5d37f03a1f5323#src/ol/layer/layerbase.js
 */
goog.provide('os.mixin.layerbase');

goog.require('ol.layer.Base');
goog.require('ol.layer.Property');


/**
 * @type {string}
 */
ol.layer.Property.BRIGHTNESS = 'brightness';


/**
 * @type {string}
 */
ol.layer.Property.CONTRAST = 'contrast';


/**
 * @type {string}
 */
ol.layer.Property.HUE = 'hue';


/**
 * @type {string}
 */
ol.layer.Property.SATURATION = 'saturation';


/**
 * Return the brightness of the layer.
 * @return {number} The brightness of the layer.
 */
ol.layer.Base.prototype.getBrightness = function() {
  return /** @type {number} */ (this.get(ol.layer.Property.BRIGHTNESS));
};


/**
 * Return the contrast of the layer.
 * @return {number} The contrast of the layer.
 */
ol.layer.Base.prototype.getContrast = function() {
  return /** @type {number} */ (this.get(ol.layer.Property.CONTRAST));
};


/**
 * Return the hue of the layer.
 * @return {number} The hue of the layer.
 */
ol.layer.Base.prototype.getHue = function() {
  return /** @type {number} */ (this.get(ol.layer.Property.HUE));
};


/**
 * Return the saturation of the layer.
 * @return {number} The saturation of the layer.
 */
ol.layer.Base.prototype.getSaturation = function() {
  return /** @type {number} */ (this.get(ol.layer.Property.SATURATION));
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
ol.layer.Base.prototype.setBrightness = function(brightness) {
  this.set(ol.layer.Property.BRIGHTNESS, brightness);
};


/**
 * Adjust the layer contrast.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the contrast unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} contrast The contrast of the layer.
 */
ol.layer.Base.prototype.setContrast = function(contrast) {
  this.set(ol.layer.Property.CONTRAST, contrast);
};


/**
 * Adjust the layer hue.  A value of 0 will render the layer completely
 * grey.  A value of 1 will leave the hue unchanged.  Other values are
 * linear multipliers on the effect (and values over 1 are permitted).
 *
 * @param {number} hue The hue of the layer.
 */
ol.layer.Base.prototype.setHue = function(hue) {
  this.set(ol.layer.Property.HUE, hue);
};


/**
 * Adjust layer saturation.  A value of 0 will render the layer completely
 * unsaturated.  A value of 1 will leave the saturation unchanged.  Other
 * values are linear multipliers of the effect (and values over 1 are
 * permitted).
 *
 * @param {number} saturation The saturation of the layer.
 */
ol.layer.Base.prototype.setSaturation = function(saturation) {
  this.set(ol.layer.Property.SATURATION, saturation);
};
