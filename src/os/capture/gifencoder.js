goog.provide('os.capture.GifEncoder');

goog.require('os.capture');
goog.require('os.capture.AbstractVideoEncoder');
goog.require('os.capture.gif');
goog.require('os.defines');



/**
 * @extends {os.capture.AbstractVideoEncoder}
 * @constructor
 */
os.capture.GifEncoder = function() {
  os.capture.GifEncoder.base(this, 'constructor');
  this.description = 'Widely supported format, but may exhibit loss of quality.';
  this.extension = 'gif';
  this.title = 'GIF';
  this.scriptUrl = os.capture.GifEncoder.SCRIPT_URL;

  /**
   * Diff frames used in the GIF.
   * @type {!Array<ImageData>}
   * @private
   */
  this.gifFrames_ = [];

  /**
   * @type {?GIF}
   * @private
   */
  this.gif_ = null;
};
goog.inherits(os.capture.GifEncoder, os.capture.AbstractVideoEncoder);


/**
 * The URL to the Whammy Javascript library.
 * @type {string}
 * @const
 */
os.capture.GifEncoder.SCRIPT_URL = os.ROOT + 'vendor/gif/gif.js';


/**
 * @inheritDoc
 */
os.capture.GifEncoder.prototype.abort = function() {
  if (this.gif_) {
    this.gif_.abort();
  }
};


/**
 * @inheritDoc
 */
os.capture.GifEncoder.prototype.cleanup = function() {
  os.capture.GifEncoder.base(this, 'cleanup');

  this.gifFrames_.length = 0;

  if (this.gif_) {
    this.gif_.removeAllListeners();
    this.gif_.cleanUp();
    this.gif_ = null;
  }
};


/**
 * @inheritDoc
 */
os.capture.GifEncoder.prototype.isEncoderLoaded = function() {
  return window['GIF'] != null;
};


/**
 * @inheritDoc
 */
os.capture.GifEncoder.prototype.processInternal = function() {
  try {
    // 1 is the best quality, and gif.js will reduce output quality as this number is increased. we'll just choose
    // 100 as the lowest value.
    var gifQuality = 100 - (99 * this.quality);

    // using 4 workers as a rough guess of what won't consume all oss on a "standard user's" machine.
    this.gif_ = new GIF({
      background: '#000',
      cleanUp: true,
      quality: gifQuality,
      transparent: 0x000000,
      workerScript: os.capture.gif.WORKER_SCRIPT,
      workers: 4
    });

    this.generateDiffFrames_();

    // use the controller's framerate in the GIF
    var delay = 1 / this.frameRate * 1000;
    this.gifFrames_.forEach(function(f) {
      this.gif_.addFrame(f, {delay: delay});
    }, this);

    this.gif_.on(os.capture.gif.EventType.PROGRESS, this.onGifProgress_.bind(this));
    this.gif_.on(os.capture.gif.EventType.FINISHED, this.onGifFinished_.bind(this));
    this.gif_.render();

    this.setProgress(0);
    this.setStatus('Generating animated GIF...');
  } catch (e) {
    this.handleError('failed generating GIF', e);
  }
};


/**
 * Converts canvas frames to diff frames for GIF generation.
 * @private
 */
os.capture.GifEncoder.prototype.generateDiffFrames_ = function() {
  var diffFrames = [];
  for (var i = 0; i < this.frames.length; i++) {
    diffFrames.push(this.getFrame_(this.frames[i]));

    if (diffFrames.length > 1) {
      // diff'd frames will be modified directly, so make two copies of each frame past the first. the first
      // copy is compared against the previous frame, and the second copy is compared against the next frame.
      diffFrames.push(this.getFrame_(this.frames[i]));
    }
  }

  // clear out the original frames
  this.frames.length = 0;

  // add the first frame as-is
  this.gifFrames_.push(diffFrames[0]);

  // for the rest of the frames, add the diff from the previous
  for (var i = 0; i < diffFrames.length - 1; i += 2) {
    this.gifFrames_.push(this.doDiff_(diffFrames[i], diffFrames[i + 1]));
  }
};


/**
 * Compute the difference between two frames, setting pixels that don't change to transparent. This makes the generated
 * GIF significantly smaller.
 *
 * @param {ImageData} frame1
 * @param {ImageData} frame2
 * @return {ImageData}
 * @private
 */
os.capture.GifEncoder.prototype.doDiff_ = function(frame1, frame2) {
  // deeming this acceptable GC for the sake of simplicity. the alternative is to compare each RGBA byte for each pixel
  var frame1Buffer = new Uint32Array(frame1.data.buffer);
  var frame2Buffer = new Uint32Array(frame2.data.buffer);
  for (var i = 0; i < frame1Buffer.length; i++) {
    // if the pixel is the same, make it transparent (see below in the GIF instantiation)
    if (frame1Buffer[i] === frame2Buffer[i]) {
      frame2Buffer[i] = 0;
    }
  }

  return frame2;
};


/**
 * Translates a canvas frame to ImageData.
 * @param {!HTMLCanvasElement} canvas
 * @return {ImageData}
 * @private
 */
os.capture.GifEncoder.prototype.getFrame_ = function(canvas) {
  try {
    return os.capture.getCanvasData(canvas);
  } catch (e) {
    this.handleError('failed retrieving canvas frame', e);
  }

  return null;
};


/**
 * Handle GIF library progress event.
 * @param {number} progress The progress value as a decimal from 0-1.
 * @private
 */
os.capture.GifEncoder.prototype.onGifProgress_ = function(progress) {
  this.setProgress(Math.ceil(progress * 100));
};


/**
 * Handle GIF library finished event.
 * @param {Uint8Array} data The GIF data
 * @private
 */
os.capture.GifEncoder.prototype.onGifFinished_ = function(data) {
  this.output = data;
  this.dispatchEvent(os.capture.CaptureEventType.COMPLETE);
};
