goog.module('os.source.ImageStatic');

const ImageState = goog.require('ol.ImageState');
const {intersects} = goog.require('ol.extent');
const OLImageStatic = goog.require('ol.source.ImageStatic');
const {rotate} = goog.require('os.ol.image');

const ImageBase = goog.requireType('ol.ImageBase');


/**
 * @suppress {accessControls}
 */
class ImageStatic extends OLImageStatic {
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

exports = ImageStatic;
