goog.module('plugin.audio.mime');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const mimeText = goog.require('os.file.mime.text');

const OSFile = goog.requireType('os.file.File');


/**
 * Priority for audio file detection. Some audio formats (like .wav) may be detected as text, so this has to run first.
 * @type {number}
 */
const PRIORITY = mimeText.PRIORITY - 1;

/**
 * MIME type for audio files.
 * @type {string}
 */
const TYPE = 'application/audio';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<*|undefined>}
 */
const detect = function(buffer, opt_file) {
  return /** @type {!Promise<*|undefined>} */ (
    Promise.resolve(opt_file && /\.(mp3|wav|ogg|m4a)$/i.test(opt_file.getFileName())));
};

// Some audio formats (like .wav) may be detected as text, so this has to run first.
mime.register(TYPE, detect, PRIORITY);

exports = {
  PRIORITY,
  TYPE,
  detect
};
