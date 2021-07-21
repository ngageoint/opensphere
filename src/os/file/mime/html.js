goog.module('os.file.mime.html');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const text = goog.require('os.file.mime.text');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = 'text/html';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detectHtml = function(buffer, file, opt_context) {
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

exports = {
  TYPE,
  detectHtml
};
