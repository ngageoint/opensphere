goog.module('plugin.arc.mime');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const {TYPE: HTML_TYPE} = goog.require('os.file.mime.html');
const {TYPE: XML_TYPE} = goog.require('os.file.mime.xml');
const arc = goog.require('plugin.arc');

const OSFile = goog.requireType('os.file.File');
const XMLContext = goog.requireType('os.file.mime.xml.Context');


/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detectArc = function(buffer, file, opt_context) {
  var url = file ? file.getUrl() : null;
  var content = typeof opt_context === 'string' ? opt_context :
  /** @type {XMLContext} */ (opt_context.content);
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve((content &&
    arc.CONTENT_REGEXP.test(content)) ||
    (arc.URI_REGEXP.test(url) && !arc.WMS_URI_REGEXP.test(url))));
};


/**
 * If mime types have been registered.
 * @type {boolean}
 */
let registered = false;


/**
 * Register Arc mime types.
 */
const registerMimeTypes = () => {
  if (!registered) {
    mime.register(arc.ID, detectArc, 0, XML_TYPE);
    mime.register(arc.ID, detectArc, 0, HTML_TYPE);
    registered = true;
  }
};


exports = {
  detectArc,
  registerMimeTypes
};
