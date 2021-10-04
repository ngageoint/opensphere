goog.declareModuleId('os.file.mime.csv');

import * as mime from '../mime.js';
import * as text from './text.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'text/csv';

/**
 * @type {string}
 */
export const APPLICATION_TYPE = 'application/csv';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<*|undefined>}
 */
export const detect = function(buffer, opt_file) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(opt_file && (/\.csv$/.test(opt_file.getFileName()) ||
      TYPE == opt_file.getContentType() ||
      APPLICATION_TYPE == opt_file.getContentType())));
};


mime.register(TYPE, detect, 1000, text.TYPE);
