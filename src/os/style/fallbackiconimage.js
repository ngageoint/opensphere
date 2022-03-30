goog.declareModuleId('os.style.FallbackIconImage');

import ImageState from 'ol/src/ImageState.js';
import IconImage from 'ol/src/style/IconImage.js';

import ProxyHandler from '../net/proxyhandler.js';
import Request from '../net/request.js';
import {DEFAULT_ICON} from './styledefaults.js';

const Uri = goog.require('goog.Uri');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');


/**
 */
export default class FallbackIconImage extends IconImage {
  /**
   * Constructor.
   * @param {Image|HTMLCanvasElement} image Image.
   * @param {string|undefined} src Src.
   * @param {ol.Size} size Size.
   * @param {?string} crossOrigin Cross origin.
   * @param {ImageState} imageState Image state.
   * @param {ol.Color} color Color.
   */
  constructor(image, src, size, crossOrigin, imageState, color) {
    super(image, src, size, crossOrigin, imageState, color);

    /**
     * @type {?string}
     * @protected
     */
    this.crossOrigin = crossOrigin;

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

    this.log = logger;
  }

  /**
   * @inheritDoc
   * @suppress {accessControls}
   */
  handleImageError_() {
    this.errorCount_++;
    var url = this.originalSrc;
    var dataUrlRx = FallbackIconImage.DATA_URL_RX;

    if (this.errorCount_ === 1) {
      // Some older versions of Firefox contain a bug which causes
      // Data URI images containing a crossOrigin value not to load
      if (url && dataUrlRx.test(url) && this.crossOrigin) {
        log.fine(this.log, 'attempting to retry data URL ' + url + ' with an empty crossOrigin value');
        this.imageState_ = ImageState.IDLE;
        this.crossOrigin = null;
        this.load();
        return;
      }
      this.errorCount_++;
    }

    if (this.errorCount_ === 2) {
      // try loading the image through the proxy
      var uri = new Uri(url);
      var handler = new ProxyHandler();

      if (url && handler.handles(Request.METHOD_GET, uri)) {
        log.fine(this.log, 'attempting to retry URL ' + url + ' through the proxy');
        this.imageState_ = ImageState.IDLE;
        this.src_ = ProxyHandler.getProxyUri(url);
        this.load();
        return;
      }
      this.errorCount_++;
    }

    if (this.errorCount_ === 3) {
      // fall back to the default icon
      log.fine(this.log, 'falling back to default icon');
      this.imageState_ = ImageState.IDLE;
      this.src_ = DEFAULT_ICON;
      this.load();
      return;
    }

    log.error(this.log, 'Unknown error accessing icon!');
    super.handleImageError_();
  }
}

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.style.FallbackIconImage');

/**
 * Simple test for data URL
 * @const {RegExp}
 */
FallbackIconImage.DATA_URL_RX = new RegExp('^data', 'i');
