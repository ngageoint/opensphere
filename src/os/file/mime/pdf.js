goog.module('os.file.mime.pdf');
goog.module.declareLegacyNamespace();

const Promise = goog.require('goog.Promise');
const mime = goog.require('os.file.mime');


/**
 * @type {number}
 */
const MAGIC_BYTES_BIG_ENDIAN = 0x25504446;

/**
 * @type {string}
 */
const TYPE = 'application/pdf';

/**
 * @param {ArrayBuffer} buffer
 * @return {!Promise<boolean>}
 */
const isPDF = function(buffer) {
  if (buffer && buffer.byteLength > 3) {
    // PDF magic number can occur anywhere in the first 1024 bytes
    var dv = new DataView(buffer);
    for (var i = 0, n = Math.min(1024, dv.byteLength) - 4; i < n; i++) {
      if (dv.getUint32(i) === MAGIC_BYTES_BIG_ENDIAN) {
        return Promise.resolve(true);
      }
    }
  }

  return Promise.resolve(false);
};


// We register PDF, not because we do anything with it, but because we do
// not want to accidentally detect PDF documents as text since they tend
// to contain a large amount of text content.
mime.register(TYPE, isPDF);

exports = {
  MAGIC_BYTES_BIG_ENDIAN,
  TYPE,
  isPDF
};
