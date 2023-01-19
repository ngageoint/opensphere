goog.declareModuleId('plugin.audio.mime');

import * as mimeText from '../../os/file/mime/text.js';
import * as mime from '../../os/file/mime.js';

const Promise = goog.require('goog.Promise');

/**
 * Priority for audio file detection. Some audio formats (like .wav) may be detected as text, so this has to run first.
 * @type {number}
 */
export const PRIORITY = mimeText.PRIORITY - 1;

/**
 * MIME type for audio files.
 * @type {string}
 */
export const TYPE = 'application/audio';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<*|undefined>}
 */
export const detect = function(buffer, opt_file) {
  return /** @type {!Promise<*|undefined>} */ (
    Promise.resolve(opt_file && /\.(mp3|wav|ogg|m4a)$/i.test(opt_file.getFileName())));
};

// Some audio formats (like .wav) may be detected as text, so this has to run first.
mime.register(TYPE, detect, PRIORITY);
