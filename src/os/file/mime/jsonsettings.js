goog.declareModuleId('os.file.mime.jsonsettings');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const jsonMime = goog.require('os.file.mime.json');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'application/vnd.settings+json';


/**
 * Settings file root keys.
 * @type {!Array<string>}
 */
const rootKeys = ['admin', 'user', 'overrides'];


/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detect = function(buffer, file, opt_context) {
  var retVal;

  if (opt_context && goog.isObject(opt_context) && Object.keys(opt_context).some((key) => rootKeys.indexOf(key) > -1)) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

mime.register(TYPE, detect, 0, jsonMime.TYPE);
