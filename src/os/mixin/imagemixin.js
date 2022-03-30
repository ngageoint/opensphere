goog.declareModuleId('os.mixin.Image');

import OLImage from 'ol/src/Image.js';
import ImageState from 'ol/src/ImageState.js';

import {filterImage} from '../tile/tile.js';

/**
 * The Image source
 * @type {ImageSource}
 */
OLImage.prototype.olSource = null;

/**
 * Get the image element for this source.
 *
 * @inheritDoc
 * @suppress {accessControls}
 */
OLImage.prototype.getImage = function() {
  if (this.image_ && this.image_.width && this.image_.height && this.olSource &&
    this.getState() == ImageState.LOADED) {
    // make sure getImageFilters exists on the source
    var filterFns = this.olSource.getImageFilters ? this.olSource.getImageFilters() : [];
    if (filterFns.length > 0) {
      return filterImage(/** @type {HTMLCanvasElement|Image} */ (this.image_), filterFns);
    }
  }
  return this.image_;
};
