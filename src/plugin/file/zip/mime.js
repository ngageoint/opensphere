goog.provide('plugin.file.zip.mime');

goog.require('os.file.mime');
goog.require('os.file.mime.zip');
goog.require('plugin.file.zip');

/**
 * @const
 * @type {string}
 */
plugin.file.zip.mime.TYPE = os.file.mime.zip.TYPE;


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.file.zip.detect = os.file.mime.zip.detectZip;
