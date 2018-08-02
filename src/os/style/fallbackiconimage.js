goog.provide('os.style.FallbackIconImage');

goog.require('goog.Uri');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('ol.style.IconImage');
goog.require('os.net.ProxyHandler');


/**
 * @constructor
 * @param {Image|HTMLCanvasElement} image Image.
 * @param {string|undefined} src Src.
 * @param {ol.Size} size Size.
 * @param {?string} crossOrigin Cross origin.
 * @param {ol.ImageState} imageState Image state.
 * @param {ol.Color} color Color.
 * @extends {ol.style.IconImage}
 */
os.style.FallbackIconImage = function(image, src, size, crossOrigin, imageState, color) {
  os.style.FallbackIconImage.base(this, 'constructor', image, src, size, crossOrigin, imageState, color);

  /**
   * @type {string|undefined}
   * @protected
   */
  this.originalSrc = src;

  /**
   * @type {number}
   * @private
   */
  this.errorCount_ = 0;

  this.log = os.style.FallbackIconImage.LOGGER_;
};
goog.inherits(os.style.FallbackIconImage, ol.style.IconImage);


/**
 * The logger.
 * @const
 * @type {goog.debug.Logger}
 * @private
 */
os.style.FallbackIconImage.LOGGER_ = goog.log.getLogger('os.style.FallbackIconImage');



/**
 * Simple test for data URL
 * @const {RegExp}
 */
os.style.FallbackIconImage.DATA_URL_RX = new RegExp('^data', 'i');


/**
 * @inheritDoc
 * @suppress {accessControls}
 */
os.style.FallbackIconImage.prototype.handleImageError_ = function() {
  this.errorCount_++;
  var url = this.originalSrc;
  var dataUrlRx = os.style.FallbackIconImage.DATA_URL_RX;

  if (this.errorCount_ === 1) {
    // Some older versions of Firefox contain a bug which causes
    // Data URI images containing a crossOrigin value not to load
    if (url && dataUrlRx.test(url) && this.crossOrigin) {
      goog.log.fine(this.log, 'attempting to retry data URL ' + url + ' with an empty crossOrigin value');
      this.imageState_ = ol.ImageState.IDLE;
      this.crossOrigin = null;
      this.load();
      return;
    }
    this.errorCount_++;
  }

  if (this.errorCount_ === 2) {
    // try loading the image through the proxy
    var uri = new goog.Uri(url);
    var handler = new os.net.ProxyHandler();

    if (url && handler.handles(os.net.Request.METHOD_GET, uri)) {
      goog.log.fine(this.log, 'attempting to retry URL ' + url + ' through the proxy');
      this.imageState_ = ol.ImageState.IDLE;
      this.src_ = os.net.ProxyHandler.getProxyUri(url);
      this.load();
      return;
    }
    this.errorCount_++;
  }

  if (this.errorCount_ === 3) {
    // fall back to the default icon
    goog.log.fine(this.log, 'falling back to default icon');
    this.imageState_ = ol.ImageState.IDLE;
    this.src_ = os.style.IconReader.DEFAULT_ICON;
    this.load();
    return;
  }

  goog.log.error(this.log, 'Unknown error accessing icon!');
  os.style.FallbackIconImage.base(this, 'handleImageError_');
};
