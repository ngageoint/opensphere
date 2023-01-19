goog.declareModuleId('plugin.ogc.mime');

import * as html from '../../os/file/mime/html.js';
import * as xml from '../../os/file/mime/xml.js';
import * as mime from '../../os/file/mime.js';
import * as ogc from '../../os/ogc/ogc.js';
import GeoServer from './geoserver.js';

const Promise = goog.require('goog.Promise');

/**
 */
const capTest_ = xml.createDetect(/^(W((MT_)?M|F)S_)?Capabilities$/i, null);

/**
 */
const exTest_ = xml.createDetect(/ExceptionReport$/, /\/(ows|ogc)(\/|$)/);

/**
 * @param {Array<*|undefined>} arr
 * @return {*|undefined}
 */
const or_ = function(arr) {
  if (arr) {
    for (var i = 0, n = arr.length; i < n; i++) {
      if (arr[i]) {
        return arr[i];
      }
    }
  }
};

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detectOGC = function(buffer, file, opt_context) {
  return Promise.all([
    capTest_(buffer, file, opt_context),
    exTest_(buffer, file, opt_context)]).then(or_);
};

mime.register(ogc.ID, detectOGC, 0, xml.TYPE);


/**
 * @type {string}
 */
export const GEOSERVER_TYPE = 'geoserver';

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
export const detectGeoserver = function(buffer, file, opt_context) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(file && GeoServer.URI_REGEXP.test(file.getUrl())));
};

mime.register(GEOSERVER_TYPE, detectGeoserver, 0, ogc.ID);


// we also allow users to paste the /geoserver/web url in
mime.register(GEOSERVER_TYPE, detectGeoserver, 0, html.TYPE);
