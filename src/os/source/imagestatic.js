goog.declareModuleId('os.source.ImageStatic');

import ImageState from 'ol/ImageState';
import OLImageStatic from 'ol/source/ImageStatic';
import {intersects} from 'ol/src/extent';

import {rotate} from '../ol/image.js';

// const ImageBase = goog.requireTyped('ol.ImageBase');


/**
 * @suppress {accessControls}
 */
export default class ImageStatic extends OLImageStatic {
  /**
   * Constructor.
   * @param {olx.source.ImageStaticOptions} options
   * @param {number} rotation
   */
  constructor(options, rotation) {
    super(options);

    /**
     * @type {ImageBase}
     * @protected
     */
    this.rotatedImage = null;

    /**
     * @type {number}
     * @protected
     */
    this.rotation = rotation;

    // Set the source of the image so it can handle style changes properly
    this.image_.olSource = this;
  }

  /**
   * @inheritDoc
   */
  getImageInternal(extent, resolution, pixelRatio, projection) {
    if (this.rotatedImage && intersects(extent, this.rotatedImage.getExtent())) {
      return this.rotatedImage;
    }

    return super.getImageInternal(extent, resolution, pixelRatio, projection);
  }

  /**
   * @inheritDoc
   */
  handleImageChange(evt) {
    super.handleImageChange(evt);

    var image = /** @type {ol.Image} */ (evt.target);
    if (image.getState() == ImageState.LOADED) {
      this.rotatedImage = this.rotation ? rotate(image, this.rotation) : image;
      this.changed();
    }
  }
}
