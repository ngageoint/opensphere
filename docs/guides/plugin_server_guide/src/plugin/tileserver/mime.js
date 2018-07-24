goog.provide('plugin.tileserver.mime');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.json');


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.tileserver.mime.detect = function(buffer, file, opt_context) {
  var retVal;

  // the parent type (JSON) gives the context as the parsed JSON
  // (so far)

  if (opt_context && Array.isArray(opt_context) && opt_context.length &&
    'tilejson' in opt_context[0]) {
    retVal = opt_context;
  }

  return goog.Promise.resolve(retVal);
};

os.file.mime.register(
    // for providers, this must be the same as the ProviderEntry ID
    plugin.tileserver.ID,
    // our detect function
    plugin.tileserver.mime.detect,
    // the priority; lower numbers run earlier
    0,
    // the parent type
    os.file.mime.json.TYPE);
