goog.declareModuleId('plugin.arc.mime');

import {TYPE as HTML_TYPE} from '../../os/file/mime/html.js';
import {TYPE as XML_TYPE} from '../../os/file/mime/xml.js';
import * as mime from '../../os/file/mime.js';
import * as arc from './arc.js';

const Promise = goog.require('goog.Promise');


/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detectArc = function(buffer, file, opt_context) {
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
export const registerMimeTypes = () => {
  if (!registered) {
    mime.register(arc.ID, detectArc, 0, XML_TYPE);
    mime.register(arc.ID, detectArc, 0, HTML_TYPE);
    registered = true;
  }
};
