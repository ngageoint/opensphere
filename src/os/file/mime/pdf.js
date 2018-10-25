goog.provide('os.file.mime.pdf');

goog.require('goog.Promise');
goog.require('os.file.mime');


/**
 * @const
 * @type {number}
 */
os.file.mime.pdf.MAGIC_BYTES_BIG_ENDIAN = 0x25504446;

/**
 * @const
 * @type {string}
 */
os.file.mime.pdf.TYPE = 'application/pdf';


/**
 * @param {ArrayBuffer} buffer
 * @return {!goog.Promise<boolean>}
 */
os.file.mime.pdf.isPDF = function(buffer) {
  if (buffer && buffer.byteLength > 3) {
    // PDF magic number can occur anywhere in the first 1024 bytes
    var dv = new DataView(buffer);
    for (var i = 0, n = Math.min(1024, dv.byteLength) - 4; i < n; i++) {
      if (dv.getUint32(i) === os.file.mime.pdf.MAGIC_BYTES_BIG_ENDIAN) {
        return goog.Promise.resolve(true);
      }
    }
  }

  return goog.Promise.resolve(false);
};


// We register PDF, not because we do anything with it, but because we do
// not want to accidentally detect PDF documents as text since they tend
// to contain a large amount of text content.
os.file.mime.register(os.file.mime.pdf.TYPE, os.file.mime.pdf.isPDF);
