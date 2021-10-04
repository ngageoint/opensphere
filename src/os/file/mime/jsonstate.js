goog.declareModuleId('os.file.mime.jsonstate');

import Tag from '../../state/tag.js';
import * as mime from '../mime.js';
import * as json from './json.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'application/vnd.state+json';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detect = function(buffer, file, opt_context) {
  var retVal;

  if (opt_context && goog.isObject(opt_context) && Array.isArray(opt_context[Tag.STATE])) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

mime.register(TYPE, detect, 0, json.TYPE);
