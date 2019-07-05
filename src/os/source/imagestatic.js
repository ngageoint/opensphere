goog.provide('os.source.ImageStatic');

goog.require('ol.ImageState');
goog.require('ol.extent');
goog.require('ol.source.ImageStatic');
goog.require('os.ol.image');


/**
 * @constructor
 * @extends {ol.source.ImageStatic}
 * @param {olx.source.ImageStaticOptions} options
 * @param {number} rotation
 */
os.source.ImageStatic = function(options, rotation) {
  os.source.ImageStatic.base(this, 'constructor', options);

  /**
   * @type {ol.ImageBase}
   * @protected
   */
  this.rotatedImage = null;

  /**
   * @type {number}
   * @protected
   */
  this.rotation = rotation;
};
goog.inherits(os.source.ImageStatic, ol.source.ImageStatic);


/**
 * @inheritDoc
 */
os.source.ImageStatic.prototype.getImageInternal = function(extent, resolution, pixelRatio, projection) {
  if (this.rotatedImage && ol.extent.intersects(extent, this.rotatedImage.getExtent())) {
    return this.rotatedImage;
  }

  return os.source.ImageStatic.base(this, 'getImageInternal', extent, resolution, pixelRatio, projection);
};

/**
 * @inheritDoc
 */
os.source.ImageStatic.prototype.handleImageChange = function(evt) {
  os.source.ImageStatic.base(this, 'handleImageChange', evt);

  var image = /** @type {ol.Image} */ (evt.target);
  if (image.getState() == ol.ImageState.LOADED) {
    this.rotatedImage = this.rotation ? os.ol.image.rotate(image, this.rotation) : image;
    this.changed();
  }
};
