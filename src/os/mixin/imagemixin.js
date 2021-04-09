goog.provide('os.mixin.Image');

goog.require('ol.Image');
goog.require('ol.ImageState');


/**
 * Get the image element for this source.
 *
 * @inheritDoc
 * @suppress {accessControls}
 */
ol.Image.prototype.getImage = function() {
  if (this.image_ && this.image_.width && this.image_.height && this.olSource
    && this.getState() == ol.ImageState.LOADED) {
    // make sure getImageFilters exists on the source
    var filterFns = this.olSource.getImageFilters ? this.olSource.getImageFilters() : [];
    if (filterFns.length > 0) {
      if (!this.filtered_) {
        // create a cached copy of the filtered image
        this.filtered_ = os.tile.filterImage(this.image_, filterFns);
      }

      return this.filtered_;
    }
  }
  return this.image_;
};
