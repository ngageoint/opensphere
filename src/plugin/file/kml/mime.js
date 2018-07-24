goog.provide('plugin.file.kml.mime');

goog.require('goog.Promise');
goog.require('os.file.mime.xml');
goog.require('os.file.mime.zip');

/**
 * @const
 * @type {string}
 */
plugin.file.kml.mime.TYPE = 'application/vnd.google-earth.kml+xml';


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.file.kml.detect = function(buffer, opt_file, opt_context) {
  var retVal;
  if (opt_context && (
      (/^(document|folder|kml)$/i.test(opt_context.rootTag)) ||
      (/\/kml\//i.test(opt_context.rootNS)))) {
    retVal = opt_context;
  }

  return goog.Promise.resolve(retVal);
};
os.file.mime.register(
    plugin.file.kml.mime.TYPE,
    plugin.file.kml.detect,
    0, os.file.mime.xml.TYPE);


/**
 * @const
 * @type {string}
 */
plugin.file.kml.mime.KMZ_TYPE = 'application/vnd.google-earth.kmz';

os.file.mime.register(
    plugin.file.kml.mime.KMZ_TYPE,
    os.file.mime.zip.createDetect(/\.kml$/i),
    0, os.file.mime.zip.TYPE);
