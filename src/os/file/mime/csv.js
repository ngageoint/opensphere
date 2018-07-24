goog.provide('os.file.mime.csv');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.text');


/**
 * @type {string}
 * @const
 */
os.file.mime.csv.TYPE = 'text/csv';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {!goog.Promise<*|undefined>}
 */
os.file.mime.csv.detect = function(buffer, opt_file) {
  return /** @type {!goog.Promise<*|undefined>} */ (
      goog.Promise.resolve(opt_file && (/\.csv$/.test(opt_file.getFileName()) ||
      opt_file.getContentType() === os.file.mime.csv.TYPE)));
};


os.file.mime.register(os.file.mime.csv.TYPE, os.file.mime.csv.detect, 1000, os.file.mime.text.TYPE);
