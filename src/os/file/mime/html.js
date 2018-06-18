goog.provide('os.file.mime.html');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.text');


/**
 * @type {string}
 * @const
 */
os.file.mime.html.TYPE = 'text/html';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
os.file.mime.html.detectHtml = function(buffer, file, opt_context) {
  var retVal;

  if ((file && file.getFileName() && /\.x?html?$/i.test(file.getFileName())) ||
      (file && file.getContentType() === os.file.mime.html.TYPE) ||
      (opt_context && goog.isString(opt_context) && opt_context.trim().startsWith('<!DOCTYPE html'))) {
    retVal = opt_context;
  }

  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve(retVal));
};


// as much as we'd like HTML to be a child of XML, it isn't
os.file.mime.register(os.file.mime.html.TYPE, os.file.mime.html.detectHtml, -10, os.file.mime.text.TYPE);
