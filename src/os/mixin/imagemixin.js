goog.module('os.mixin.Image');
goog.module.declareLegacyNamespace();

const olImage = goog.require('ol.Image');
const ImageState = goog.require('ol.ImageState');
const tile = goog.require('os.tile');

const ImageSource = goog.requireType('ol.source.Image');


/**
 * The Image source
 * @type {ImageSource}
 */
ol.Image.prototype.olSource = null;


/**
 * Get the image element for this source.
 *
 * @inheritDoc
 * @suppress {accessControls}
 */
olImage.prototype.getImage = function() {
  if (this.image_ && this.image_.width && this.image_.height && this.olSource &&
    this.getState() == ImageState.LOADED) {
    // make sure getImageFilters exists on the source
    var filterFns = this.olSource.getImageFilters ? this.olSource.getImageFilters() : [];
    if (filterFns.length > 0) {
      return tile.filterImage(/** @type {HTMLCanvasElement|Image} */ (this.image_), filterFns);
    }
  }
  return this.image_;
};
