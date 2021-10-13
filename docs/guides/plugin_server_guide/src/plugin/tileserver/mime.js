goog.declareModuleId('plugin.tileserver.mime');

import {register} from 'opensphere/src/os/file/mime.js';
import {TYPE} from 'opensphere/src/os/file/mime/json.js';
import {ID} from './index.js';

const Promise = goog.require('goog.Promise');
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detect = function(buffer, file, opt_context) {
  var retVal;

  // the parent type (JSON) gives the context as the parsed JSON
  // (so far)

  if (opt_context && Array.isArray(opt_context) && opt_context.length && 'tilejson' in opt_context[0]) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};

register(
    // for providers, this must be the same as the ProviderEntry ID
    ID,
    detect,
    // the priority; lower numbers run earlier
    0,
    // the parent type
    TYPE);
