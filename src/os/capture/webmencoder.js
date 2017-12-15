goog.provide('os.capture.WebMEncoder');

goog.require('os.capture');
goog.require('os.capture.AbstractVideoEncoder');
goog.require('os.defines');



/**
 * A WebM video encoder.
 * @extends {os.capture.AbstractVideoEncoder}
 * @constructor
 */
os.capture.WebMEncoder = function() {
  os.capture.WebMEncoder.base(this, 'constructor');
  this.description = 'Higher quality, but designed to be viewed in web browsers.';
  this.extension = 'webm';
  this.title = 'WebM';
  this.scriptUrl = os.capture.WebMEncoder.SCRIPT_URL;

  /**
   * The WebM video encoder.
   * @type {?Whammy.Video}
   * @private
   */
  this.webm_ = null;
};
goog.inherits(os.capture.WebMEncoder, os.capture.AbstractVideoEncoder);


/**
 * The URL to the Whammy Javascript library.
 * @type {string}
 * @const
 */
os.capture.WebMEncoder.SCRIPT_URL = os.ROOT + 'vendor/whammy/whammy.min.js';


/**
 * @inheritDoc
 */
os.capture.WebMEncoder.prototype.cleanup = function() {
  os.capture.WebMEncoder.base(this, 'cleanup');
  this.webm_ = null;
};


/**
 * @inheritDoc
 */
os.capture.WebMEncoder.prototype.isEncoderLoaded = function() {
  return window['Whammy'] != null;
};


/**
 * @inheritDoc
 */
os.capture.WebMEncoder.prototype.processInternal = function() {
  try {
    this.webm_ = new Whammy.Video(this.frameRate, this.quality);
    this.setStatus('Generating WebM video...');

    for (var i = 0; i < this.frames.length; i++) {
      this.webm_.add(this.frames[i]);
    }

    this.webm_.compile(false, this.onVideoReady_.bind(this));
  } catch (e) {
    this.handleError('failed generating WebM video', e);
  }
};


/**
 * Complete callback for the WebM video compile function.
 * @param {Blob|Uint8Array} data The processed video.
 * @private
 */
os.capture.WebMEncoder.prototype.onVideoReady_ = function(data) {
  this.output = data;
  this.dispatchEvent(os.capture.CaptureEventType.COMPLETE);
};
