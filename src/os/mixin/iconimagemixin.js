goog.provide('os.mixin.IconImageMixin');
goog.require('ol.style.IconImage');
goog.require('os.style.FallbackIconImage');

/**
 * Overridden to return our own type for the image
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @return {ol.style.IconImage} Icon image.
 * @suppress {duplicate}
 */
ol.style.IconImage.get = function(image, src, size, crossOrigin, imageState, color) {
  var iconImageCache = ol.style.iconImageCache;
  var iconImage = iconImageCache.get(src, crossOrigin, color);
  if (!iconImage) {
    iconImage = new os.style.FallbackIconImage(image, src, size, crossOrigin, imageState, color);
    iconImageCache.set(src, crossOrigin, color, iconImage);
  }
  return iconImage;
};

