goog.provide('os.file.mime.jsonstate');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.json');


/**
 * @type {string}
 * @const
 */
os.file.mime.jsonstate.TYPE = 'application/vnd.state+json';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
os.file.mime.jsonstate.detect = function(buffer, file, opt_context) {
  var retVal;

  if (opt_context && goog.isObject(opt_context) && Array.isArray(opt_context[os.state.Tag.STATE])) {
    retVal = opt_context;
  }

  return goog.Promise.resolve(opt_context);
};


os.file.mime.register(
    os.file.mime.jsonstate.TYPE,
    os.file.mime.jsonstate.detect,
    0, os.file.mime.json.TYPE);
