goog.provide('plugin.ogc.mime');

goog.require('goog.Promise');
goog.require('os.file.mime');
goog.require('os.file.mime.html');
goog.require('os.file.mime.xml');
goog.require('os.ogc');
goog.require('plugin.ogc.GeoServer');


/**
 * @private
 */
plugin.ogc.mime.capTest_ = os.file.mime.xml.createDetect(/^W((MT_)?M|F)S_Capabilities$/i, null);

/**
 * @private
 */
plugin.ogc.mime.exTest_ = os.file.mime.xml.createDetect(/ExceptionReport$/, /\/(ows|ogc)(\/|$)/);

/**
 * @param {Array<*|undefined>} arr
 * @return {*|undefined}
 * @private
 */
plugin.ogc.mime.or_ = function(arr) {
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
 * @return {!goog.Promise<*|undefined>}
 */
plugin.ogc.mime.detectOGC = function(buffer, file, opt_context) {
  return goog.Promise.all([
    plugin.ogc.mime.capTest_(buffer, file, opt_context),
    plugin.ogc.mime.exTest_(buffer, file, opt_context)]).then(plugin.ogc.mime.or_);
};

os.file.mime.register(os.ogc.ID, plugin.ogc.mime.detectOGC, 0, os.file.mime.xml.TYPE);


/**
 * @type {string}
 * @const
 */
plugin.ogc.mime.GEOSERVER_TYPE = 'geoserver';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File} file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.ogc.mime.detectGeoserver = function(buffer, file, opt_context) {
  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve(
      file && plugin.ogc.GeoServer.URI_REGEXP.test(file.getUrl())));
};

os.file.mime.register(plugin.ogc.mime.GEOSERVER_TYPE, plugin.ogc.mime.detectGeoserver, 0, os.ogc.ID);


// we also allow users to paste the /geoserver/web url in
os.file.mime.register(plugin.ogc.mime.GEOSERVER_TYPE, plugin.ogc.mime.detectGeoserver, 0, os.file.mime.html.TYPE);
