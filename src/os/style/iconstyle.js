goog.provide('os.style.Icon');

goog.require('ol.ImageState');
goog.require('ol.style');
goog.require('ol.style.Icon');
goog.require('os.color');
goog.require('os.mixin.IconImageMixin');


/**
 * This is to handle icon styles like Google Earth. Google Earth (and also Maps) normalizes the minimum dimension
 * to 32px at scale 1.0 (16px at 0.5, 64px at 2.0, etc.).
 *
 * @constructor
 * @param {olx.style.IconOptions=} opt_options Options.
 * @extends {ol.style.Icon}
 */
os.style.Icon = function(opt_options) {
  var options = opt_options || {};

  // if an opacity wasn't provided, get it from the color
  if (options.opacity == null && options.color != null) {
    var colorArr = os.color.toRgbArray(options.color);
    if (colorArr && typeof colorArr[3] == 'number' && !isNaN(colorArr[3])) {
      options.opacity = /** @type {number} */ (colorArr[3]);
    }
  }

  os.style.Icon.base(this, 'constructor', options);

  /**
   * @type {number}
   * @private
   */
  this.normalizedScale_ = 0;

  /**
   * @type {olx.style.IconOptions|undefined}
   * @private
   */
  this.originalOptions_ = opt_options;

  this.listenImageChange(this.onImageChange, this);
};
goog.inherits(os.style.Icon, ol.style.Icon);


/**
 * @inheritDoc
 */
os.style.Icon.prototype.getScale = function() {
  if (this.normalizedScale_) {
    return this.normalizedScale_;
  } else {
    var size = this.getSize();
    var scale = os.style.Icon.base(this, 'getScale');

    if (size) {
      this.normalizedScale_ = scale = 32 * scale / Math.min(size[0], size[1]);
    }
  }

  return scale;
};


/**
 * @param {ol.events.Event} event
 * @suppress {accessControls}
 */
os.style.Icon.prototype.onImageChange = function(event) {
  var state = this.iconImage_.getImageState();

  if (state >= ol.ImageState.LOADED) {
    this.unlistenImageChange(this.onImageChange, this);
  }

  if (state === ol.ImageState.LOADED && this.iconImage_.getSrc() == os.style.IconReader.DEFAULT_ICON) {
    // reset these values for the default icon
    this.setScale(1);
    this.setRotation(0);
  }
};


/**
 * Get the base image for the icon. This is necessary to check if the image has been loaded.
 * @return {Image|HTMLCanvasElement} Image.
 * @suppress {accessControls}
 */
os.style.Icon.prototype.getBaseImage = function() {
  return this.iconImage_.image_;
};
