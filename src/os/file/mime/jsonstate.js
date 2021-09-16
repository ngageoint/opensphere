goog.module('os.file.mime.jsonstate');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const json = goog.require('os.file.mime.json');
const Tag = goog.require('os.state.Tag');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = 'application/vnd.state+json';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detect = function(buffer, file, opt_context) {
  var retVal;

  if (opt_context && goog.isObject(opt_context) && Array.isArray(opt_context[Tag.STATE])) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

mime.register(TYPE, detect, 0, json.TYPE);

exports = {
  TYPE,
  detect
};
