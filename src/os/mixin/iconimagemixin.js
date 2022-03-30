goog.declareModuleId('os.mixin.IconImageMixin');

import IconImage from 'ol/src/style/IconImage.js';
import {shared} from 'ol/src/style/IconImageCache.js';

import FallbackIconImage from '../style/fallbackiconimage.js';

/**
 * Overridden to return our own type for the image
 *
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @return {IconImage} Icon image.
 * @suppress {duplicate}
 */
IconImage.prototype.get = function(image, src, size, crossOrigin, imageState, color) {
  var iconImage = shared.get(src, crossOrigin, color);
  if (!iconImage) {
    iconImage = new FallbackIconImage(image, src, size, crossOrigin, imageState, color);
    iconImageCache.set(src, crossOrigin, color, iconImage);
  }
  return iconImage;
};
