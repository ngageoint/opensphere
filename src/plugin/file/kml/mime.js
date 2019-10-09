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


/**
 * Determine if this file is a KMZ file.  Currently, the logic is:
 * Must contain *.kml file(s) and have a *.kmz filename
 *
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!goog.Promise<*|undefined>}
 */
plugin.file.kml.detectKmz = function(buffer, opt_file, opt_context) {
  var retVal;
  var kmzRegex = /\.kmz$/i;
  var kmlRegex = /\.kml$/i;

  if (opt_file && kmzRegex.test(opt_file.getFileName())) {
    if (opt_context && Array.isArray(opt_context)) {
      var entries = /** @type {!Array<!zip.Entry>} */ (opt_context);
      for (var i = 0, n = entries.length; i < n; i++) {
        if (kmlRegex.test(entries[i].filename)) {
          retVal = true;
          break;
        }
      }
    }
  }

  return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve(retVal));
};


os.file.mime.register(
    plugin.file.kml.mime.KMZ_TYPE,
    plugin.file.kml.detectKmz,
    0, os.file.mime.zip.TYPE);
