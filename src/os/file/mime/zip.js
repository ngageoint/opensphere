goog.provide('os.file.mime.zip');

goog.require('goog.Promise');
goog.require('os.file.mime');


/**
 * @const
 * @type {string}
 */
os.file.mime.zip.TYPE = 'application/zip';

/**
 * @const
 * @type {number}
 */
os.file.mime.zip.MAGIC_BYTES_BIG_ENDIAN = 0x504B0304;

/**
 * Tests if an ArrayBuffer holds zip content by looking for the magic number.
 * @param {ArrayBuffer} buffer
 * @return {boolean}
 */
os.file.mime.zip.isZip = function(buffer) {
  if (buffer && buffer.byteLength > 3) {
    var dv = new DataView(buffer.slice(0, 4));
    return os.file.mime.zip.MAGIC_BYTES_BIG_ENDIAN == dv.getUint32(0);
  }
  return false;
};


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {!goog.Promise<(!Array<!zip.Entry>|boolean|undefined)>}
 */
os.file.mime.zip.detectZip = function(buffer, opt_file) {
  if (os.file.mime.zip.isZip(buffer)) {
    // this is a zip file, get the entries
    if (window.zip) {
      return new goog.Promise(function(resolve, reject) {
        // if we have a file reference, use that
        var reader = opt_file && opt_file.getFile() ?
            new zip.BlobReader(opt_file.getFile()) :
            new zip.ArrayBufferReader(buffer);

        try {
          zip.createReader(reader, function(reader) {
            reader.getEntries(function(entries) {
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
    return /** @type {!goog.Promise<!Array<!zip.Entry>|boolean|undefined>} */ (goog.Promise.resolve(true));
  }

  return goog.Promise.resolve();
};

os.file.mime.register(os.file.mime.zip.TYPE, os.file.mime.zip.detectZip);


/**
 * @param {RegExp} fileNameRegex
 * @return {!function(ArrayBuffer, os.file.File, *=):!goog.Promise<*|undefined>} The detect function for registering with `os.file.mime`
 */
os.file.mime.zip.createDetect = function(fileNameRegex) {
  return (
    /**
     * @param {ArrayBuffer} buffer
     * @param {os.file.File=} opt_file
     * @param {*=} opt_context
     * @return {!goog.Promise<*|undefined>}
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

      return /** @type {!goog.Promise<*|undefined>} */ (goog.Promise.resolve(retVal));
    });
};
