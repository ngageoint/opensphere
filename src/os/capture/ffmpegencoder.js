goog.provide('os.capture.ffmpegEncoder');

goog.require('os.capture');
goog.require('os.capture.AbstractVideoEncoder');
goog.require('os.capture.GifEncoder');
goog.require('os.capture.WebMEncoder');
goog.require('os.defines');



/**
 * A ffmpeg video encoder.
 * @extends {os.capture.AbstractVideoEncoder}
 * @constructor
 */
os.capture.ffmpegEncoder = function() {
  os.capture.ffmpegEncoder.base(this, 'constructor');
  this.description = 'Higher quality, smaller file, many format options.';
  this.extension = 'mp4';
  this.title = 'Video';
  this.scriptUrl = os.capture.ffmpegEncoder.SCRIPT_URL;
  this.worker = null;

  /**
   * Diff frames used in the GIF.
   * @type {!Array<ImageData>}
   * @private
   */
  this.gifFrames_ = [];

  /**
   * Diff frames used in the video.
   * @type {!Array<ImageData>}
   * @private
   */
  this.videoFrames_ = [];

  /**
   * @type {?GIF}
   * @private
   */
  this.gif_ = null;
};
goog.inherits(os.capture.ffmpegEncoder, os.capture.AbstractVideoEncoder);


/**
 * The path to the ffmpeg Javascript library.
 * @type {string}
 * @const
 */
os.capture.ffmpegEncoder.SCRIPT_LOCATION = 'vendor/ffmpeg/ffmpeg_asm.js';

/**
 * The URL to the ffmpeg Javascript library.
 * @type {string}
 * @const
 */
os.capture.ffmpegEncoder.SCRIPT_URL = os.ROOT + os.capture.ffmpegEncoder.SCRIPT_LOCATION;


/**
 * @return {Worker}
 */
os.capture.ffmpegEncoder.prototype.processInWebWorker = function() {
  var ffmpegPath = window.location.href + os.capture.ffmpegEncoder.SCRIPT_LOCATION;
  var blob = URL.createObjectURL(new Blob(['importScripts("' + ffmpegPath + '");' + 
    'var now = Date.now;' +
    'function print(text) {postMessage({"type": "stdout", "data": text});};' +
    'onmessage = function(event) {var message = event.data;' +
    'if (message.type === "command") {' +
    'var Module = {' +
    'print: print,' +
    'printErr: print,' +
    'files: message.files || []' +
    'arguments: message.arguments || [], TOTAL_MEMORY: 268435456' +
    'postMessage({"type": "start", "data": Module.arguments.join(" ")});' +
    'postMessage({"type": "stdout", ' +
    '"data": "Received command: " + Module.arguments.join(" ") +' +
    '((Module.TOTAL_MEMORY) ? ". Processing with " + Module.TOTAL_MEMORY + " bits." : "";' +
    'var time = now();' +
    'var result = ffmpeg_run(Module);' +
    'var totalTime = now() - time;' +
    'postMessage({"type": "stdout", "data": "Finished processing (took " + totalTime + "ms"});' +
    'postMessage({"type": "done", "data": result, "time": totalTime});}};' +
    'postMessage({"type": "ready"});'], {
        type: 'application/Javascript'
      }
    )
  );

  var worker = new Worker(blob);
  URL.revokeObjectURL(blob);
  return worker;
};


/**
 * @inheritDoc
 */
os.capture.ffmpegEncoder.prototype.cleanup = function() {
  os.capture.ffmpegEncoder.base(this, 'cleanup');

  this.gifFrames_.length = 0;
  this.videoFrames_.length = 0;
};


/**
 * @inheritDoc
 */
os.capture.ffmpegEncoder.prototype.isEncoderLoaded = function() {
  return window['ffmpeg'] != null;
};


/**
 * @param {ProgressEvent} event
 */
 os.capture.ffmpegEncoder.prototype.toMP4 = function(event) {
  if (!this.worker && event) {
    var stdout = '';
    this.worker = this.processInWebWorker();
    this.worker.onmessage = function(evt) {
      var message evt.data;
      switch (message.type) {
        case 'ready':
          this.worker.postMessage({
            type: 'command',
            arguments: ['-i', 'video.gif', 'test.mp4'],
            files: [{name: 'video.gif', data: new Uint8Array(event.target.result)}]
          });
          break;
        case 'start':
          this.setStatus('Generating video...');
          break;
        case 'stdout':
          stdout += message.data + '/n';
          break;
        case 'done':
          if (mesage.data && message.data.length > 0 && message.data[0]) {
            this.output = message.data[0];
          }
          var blob = new Blob([this.output], {'type': os.capture.ContentType.MP4});

          var h2 = document.querySelector('#recordUi');
          h2.innerHTML = '<a href="' + URL.createObjectURL(blob) + '" target="_blank" download="Record Audio+Canvas' +
            ' File.mp4">Download Recorded Audio+Canvas file in MP4 container and play in VLC player!</a>';
          h2.setAttribute('contenteditable', 'false');
          // saveAs(blob, 'test.mp4');
          this.dispatchEvent(os.capture.CaptureEventType.COMPLETE);
          console.log(stdout);
          // this.worker.terminate();
          break;
        default:
          break;
      }
    }.bind(this);
  }
 };

/**
 * Complete callback for the WebM video compile function.
 * @param {Blob|Uint8Array} data The processed video.
 * @private
 */
os.capture.ffmpegEncoder.prototype.onVideoReady_ = function(data) {
  var fileReader = new FileReader();
  fileReader.onloadend = this.toMP4.bind(this);
  fileReader.readAsArrayBuffer(data);
};

/**
 * @inheritDoc
 */
os.capture.ffmpegEncoder.prototype.processInternal = function() {
  if (window['GIF'] == null) {
    goog.net.jsloader.load(os.capture.GifEncoder.SCRIPT_URL).addCallbacks(this.processInternal_, this.onScriptLoadError_, this);
  } else {
    this.processInternal_();
  }
}


/**
 * @inheritDoc
 */
os.capture.ffmpegEncoder.prototype.processInternal_ = function() {
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
os.capture.ffmpegEncoder.prototype.generateDiffFrames_ = function() {
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
os.capture.ffmpegEncoder.prototype.doDiff_ = function(frame1, frame2) {
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
os.capture.ffmpegEncoder.prototype.getFrame_ = function(canvas) {
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
os.capture.ffmpegEncoder.prototype.onGifProgress_ = function(progress) {
  this.setProgress(Math.ceil(progress * 100));
};


/**
 * Handle GIF library finished event.
 * @param {Uint8Array} data The GIF data
 * @private
 */
os.capture.ffmpegEncoder.prototype.onGifFinished_ = function(data) {
  this.output = data;
  this.dispatchEvent(os.capture.CaptureEventType.COMPLETE);
};
