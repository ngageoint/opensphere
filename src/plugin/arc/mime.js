goog.provide('plugin.arc.mime');

goog.require('os.file.mime');
goog.require('os.file.mime.html');
goog.require('os.file.mime.xml');
goog.require('plugin.arc');


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.arc.mime.detectArc = function(buffer, file, opt_context) {
  var content = goog.isString(opt_context) ? opt_context :
      /** @type {os.file.mime.xml.Context} */ (opt_context.content);
  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve((content &&
    plugin.arc.CONTENT_REGEXP.test(content)) ||
    (file && file.getUrl() && plugin.arc.URI_REGEXP.test(file.getUrl()))));
};


os.file.mime.register(plugin.arc.ID, plugin.arc.mime.detectArc, 0, os.file.mime.xml.TYPE);
os.file.mime.register(plugin.arc.ID, plugin.arc.mime.detectArc, 0, os.file.mime.html.TYPE);
