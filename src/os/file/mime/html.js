goog.declareModuleId('os.file.mime.html');

import * as mime from '../mime.js';
import * as text from './text.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'text/html';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detectHtml = function(buffer, file, opt_context) {
  var retVal;

  if ((file && file.getFileName() && /\.x?html?$/i.test(file.getFileName())) ||
      (file && file.getContentType() === TYPE) ||
      (opt_context && typeof opt_context === 'string' && /^<(\!doctype )?html( |>)/i.test(opt_context.trim()))) {
    retVal = opt_context;
  }

  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(retVal));
};

// as much as we'd like HTML to be a child of XML, it isn't
mime.register(TYPE, detectHtml, -10, text.TYPE);
