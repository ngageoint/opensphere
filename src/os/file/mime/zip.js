goog.module('os.file.mime.zip');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');

const OSFile = goog.requireType('os.file.File');


/**
 * @type {string}
 */
const TYPE = 'application/zip';

/**
 * @type {number}
 */
const MAGIC_BYTES_BIG_ENDIAN = 0x504B0304;

/**
 * Tests if an ArrayBuffer holds zip content by looking for the magic number.
 *
 * @param {ArrayBuffer} buffer
 * @return {boolean}
 */
const isZip = function(buffer) {
  if (buffer && buffer.byteLength > 3) {
    var dv = new DataView(buffer.slice(0, 4));
    return MAGIC_BYTES_BIG_ENDIAN == dv.getUint32(0);
  }
  return false;
};

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<(!Array<!zip.Entry>|boolean|undefined)>}
 */
const detectZip = function(buffer, opt_file) {
  if (isZip(buffer)) {
    // this is a zip file, get the entries
    if (window.zip) {
      return new Promise(function(resolve, reject) {
        // if we have a file reference, use that
        var reader = opt_file && opt_file.getFile() ?
          new zip.BlobReader(opt_file.getFile()) :
          new zip.ArrayBufferReader(buffer);

        try {
          zip.createReader(reader, function(reader) {
            reader.getEntries(function(entries) {
              reader.close();
              resolve(entries);
            });
          }, function(error) {
            resolve(true);
          });
        } catch (e) {
          console.error(e);
        }
      });
    }

    // this cast is unfortunately necessary. faithInCompiler--
    return /** @type {!Promise<!Array<!zip.Entry>|boolean|undefined>} */ (Promise.resolve(true));
  }

  return Promise.resolve();
};

mime.register(TYPE, detectZip);

/**
 * @param {RegExp} fileNameRegex
 * @return {!function(ArrayBuffer, OSFile, *=):!Promise<*|undefined>} The detect function for registering with `mime`
 */
const createDetect = function(fileNameRegex) {
  return (
    /**
     * @param {ArrayBuffer} buffer
     * @param {OSFile=} opt_file
     * @param {*=} opt_context
     * @return {!Promise<*|undefined>}
     */
    function(buffer, opt_file, opt_context) {
      var retVal;
      if (opt_context && Array.isArray(opt_context)) {
        var entries = /** @type {!Array<!zip.Entry>} */ (opt_context);
        for (var i = 0, n = entries.length; i < n; i++) {
          if (fileNameRegex.test(entries[i].filename)) {
            retVal = true;
            break;
          }
        }
      }

      return /** @type {!Promise<*|undefined>} */ (Promise.resolve(retVal));
    }
  );
};

exports = {
  TYPE,
  MAGIC_BYTES_BIG_ENDIAN,
  isZip,
  detectZip,
  createDetect
};
