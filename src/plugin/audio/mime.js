goog.provide('plugin.audio.mime');

goog.require('goog.Promise');
goog.require('os.file.mime');


/**
 * @type {string}
 * @const
 */
plugin.audio.mime.TYPE = 'application/audio';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {!goog.Promise<*|undefined>}
 */
plugin.audio.mime.detect = function(buffer, opt_file) {
  return /** @type {!goog.Promise<*|undefined>} */ (
    goog.Promise.resolve(opt_file && /\.(mp3|wav|ogg|m4a)$/i.test(opt_file.getFileName())));
};


os.file.mime.register(plugin.audio.mime.TYPE, plugin.audio.mime.detect, 10000);
