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
  var url = file ? file.getUrl() : null;
  var content = typeof opt_context === 'string' ? opt_context :
  /** @type {os.file.mime.xml.Context} */ (opt_context.content);
  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve((content &&
    plugin.arc.CONTENT_REGEXP.test(content)) ||
    (plugin.arc.URI_REGEXP.test(url) && !plugin.arc.WMS_URI_REGEXP.test(url))));
};


os.file.mime.register(plugin.arc.ID, plugin.arc.mime.detectArc, 0, os.file.mime.xml.TYPE);
os.file.mime.register(plugin.arc.ID, plugin.arc.mime.detectArc, 0, os.file.mime.html.TYPE);
