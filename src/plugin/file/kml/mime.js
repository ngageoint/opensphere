goog.module('plugin.file.kml.mime');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');
const xml = goog.require('os.file.mime.xml');
const mimeZip = goog.require('os.file.mime.zip');


/**
 * @type {string}
 */
const TYPE = 'application/vnd.google-earth.kml+xml';

/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detect = function(buffer, opt_file, opt_context) {
  var retVal;
  if (opt_context && (
    (/^(document|folder|kml)$/i.test(opt_context.rootTag)) ||
      (/\/kml\//i.test(opt_context.rootNS)))) {
    retVal = opt_context;
  }

  return Promise.resolve(retVal);
};


mime.register(TYPE, detect, 0, xml.TYPE);


/**
 * @type {string}
 */
const KMZ_TYPE = 'application/vnd.google-earth.kmz';

/**
 * Determine if this file is a KMZ file.  Currently, the logic is:
 * 1. Must contain *.kml file(s) AND
 * 2. Must have a *.kmz filename OR have the kmz application-type
 *
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @param {*=} opt_context
 * @return {!Promise<*|undefined>}
 */
const detectKmz = function(buffer, opt_file, opt_context) {
  var retVal;
  var kmzRegex = /\.kmz$/i;
  var kmlRegex = /\.kml$/i;

  if (opt_file && (
    kmzRegex.test(opt_file.getFileName()) ||
    TYPE == opt_file.getContentType()
  )) {
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

  return /** @type {!Promise<*|undefined>} */ (Promise.resolve(retVal));
};


mime.register(KMZ_TYPE, detectKmz, 0, mimeZip.TYPE);

exports = {
  TYPE,
  KMZ_TYPE
};
