goog.module('os.file.mime.csv');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const text = goog.require('os.file.mime.text');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = 'text/csv';

/**
 * @type {string}
 */
const APPLICATION_TYPE = 'application/csv';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<*|undefined>}
 */
const detect = function(buffer, opt_file) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(opt_file && (/\.csv$/.test(opt_file.getFileName()) ||
      TYPE == opt_file.getContentType() ||
      APPLICATION_TYPE == opt_file.getContentType())));
};


mime.register(TYPE, detect, 1000, text.TYPE);

exports = {
  TYPE,
  APPLICATION_TYPE,
  detect
};
