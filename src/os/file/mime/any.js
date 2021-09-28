goog.declareModuleId('os.file.mime.any');

import * as mime from '../mime.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = '*/*';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const isSomething = function(buffer, opt_file, opt_context) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(!!(buffer && buffer.byteLength)));
};

mime.register(TYPE, isSomething, 1000000);
