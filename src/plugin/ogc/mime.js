goog.module('plugin.ogc.mime');

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const html = goog.require('os.file.mime.html');
const xml = goog.require('os.file.mime.xml');
const ogc = goog.require('os.ogc');
const GeoServer = goog.require('plugin.ogc.GeoServer');


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
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detectOGC = function(buffer, file, opt_context) {
  return Promise.all([
    capTest_(buffer, file, opt_context),
    exTest_(buffer, file, opt_context)]).then(or_);
};

mime.register(ogc.ID, detectOGC, 0, xml.TYPE);


/**
 * @type {string}
 */
const GEOSERVER_TYPE = 'geoserver';

/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detectGeoserver = function(buffer, file, opt_context) {
  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(file && GeoServer.URI_REGEXP.test(file.getUrl())));
};

mime.register(GEOSERVER_TYPE, detectGeoserver, 0, ogc.ID);


// we also allow users to paste the /geoserver/web url in
mime.register(GEOSERVER_TYPE, detectGeoserver, 0, html.TYPE);

exports = {
  detectOGC,
  GEOSERVER_TYPE,
  detectGeoserver
};
