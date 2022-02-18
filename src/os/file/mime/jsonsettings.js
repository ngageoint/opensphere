goog.declareModuleId('os.file.mime.jsonsettings');

import {isObject} from '../../object/object.js';
import * as mime from '../mime.js';
import * as jsonMime from './json.js';

const Promise = goog.require('goog.Promise');

const {default: OSFile} = goog.requireType('os.file.File');


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

  if (opt_context && isObject(opt_context) &&
      Object.keys(/** @type {Object} */ (opt_context) || {}).some((key) => rootKeys.indexOf(key) > -1)) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

mime.register(TYPE, detect, 0, jsonMime.TYPE);
