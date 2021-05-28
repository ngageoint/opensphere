goog.module('plugin.audio.mime');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');

const OSFile = goog.requireType('os.file.File');

/**
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

mime.register(TYPE, detect, 10000);

exports = {
  TYPE,
  detect
};
