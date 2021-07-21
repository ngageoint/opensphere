goog.module('os.file.mime.any');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = '*/*';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const isSomething = function(buffer, opt_file, opt_context) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(!!(buffer && buffer.byteLength)));
};

mime.register(TYPE, isSomething, 1000000);

exports = {
  TYPE,
  isSomething
};
