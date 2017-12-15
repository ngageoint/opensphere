goog.provide('os.arraybuf');


/**
 * Maximum ArrayBuffer size for string conversion. Larger buffers will be converted a chunk at a time.
 * @type {number}
 * @const
 * @private
 */
os.arraybuf.MAX_STRING_CHUNK_ = 65536;


/**
 * The Byte Order Marker (BOM) sequence.
 * @type {!Array<number>}
 * @const
 */
os.arraybuf.BYTE_ORDER_MARKER = [0xef, 0xbb, 0xbf];


/**
 * Enumeration of magic numbers for array buffer type checking.
 * @enum {number}
 */
os.arraybuf.MagicNumber = {
  ZIP: 0x504b0304,
  PDF: 0x25504446
};


/**
 * Looks at the content of an ArrayBuffer to determine if it is likely to be text. Only considers the first 64k bytes
 * for performance reasons, but content is considered text if:
 *  - It is empty OR
 *  - It contains no null bytes and at least 30% of the bytes are in the ASCII printable range
 *
 * The 64k limit was set in THIN-6774 to accommodate PDF files, which may have a lot of ASCII text in the header.
 * Checking 64k bytes took ~5ms in Chrome, so it seemed reasonable... :)
 *
 * @param {ArrayBuffer} ab The buffer to test
 * @return {boolean}
 */
os.arraybuf.isText = function(ab) {
  // If UTF-8 Byte Order Mark exists
  if (goog.array.equals(new Uint8Array(ab.slice(0, 3)), os.arraybuf.BYTE_ORDER_MARKER)) {
    // just assume it is text
    return true;
  }

  var dv = new DataView(ab);
  var n = Math.min(64000, dv.byteLength);
  var has32 = n >= 4;

  if (n == 0) {
    // empty files are considered text
    return true;
  }

  if (has32 && dv.getUint32(0) == os.arraybuf.MagicNumber.ZIP) {
    // zip files are considered binary regardless of contents
    return false;
  }

  var nonTextBytes = 0;
  var pdfMax = Math.min(1021, n - 3);
  for (var i = 0; i < n; i++) {
    if (has32 && i < pdfMax) {
      // PDF magic number can occur anywhere in the first 1024 bytes according to the spec, so check each one
      var int32 = dv.getUint32(i);
      if (int32 === os.arraybuf.MagicNumber.PDF) {
        // PDF files are also considered binary regardless of contents
        return false;
      }
    }

    var b = dv.getUint8(i);

    if (b == 0) {
      // files with null bytes are likely binary
      return false;
    }

    if (!os.arraybuf.isTextCharacter(b)) {
      nonTextBytes++;
    }
  }

  if (nonTextBytes / n > 0.30) {
    return false;
  }

  return true;
};


/**
 * Checks if a byte is a text character. Text characters are defined as \n, \r, \t, \b, or within the ASCII
 * printable range.
 * @param {number} b The byte
 * @return {boolean}
 */
os.arraybuf.isTextCharacter = function(b) {
  return b == 10 || b == 13 || b == 9 || b == 8 || (b >= 32 && b <= 127);
};


/**
 * Converts an ArrayBuffer into a UTF-8 string.
 * @param {ArrayBuffer} ab The buffer
 * @return {string} The string
 */
os.arraybuf.toString = function(ab) {
  var s = '';
  // strip the BOM if the content has one
  if (goog.array.equals(new Uint8Array(ab.slice(0, 3)), os.arraybuf.BYTE_ORDER_MARKER)) {
    ab = ab.slice(3);
  }

  // TextDecoder.decode only works with a DataView in earlier versions of Firefox
  var dv = new DataView(ab);

  var toTry = ['utf-8', 'latin2', 'latin3', 'latin4', 'cyrillic', 'utf-16'];
  for (var i = 0, ii = toTry.length; i < ii; i++) {
    // this is poly-filled by the text-encoding package
    var decoder = new TextDecoder(toTry[i], {fatal: true});

    try {
      s = decoder.decode(dv);
      break;
    } catch (e) {
      // try the next encoding
    }
  }

  // trim nulls from the beginning/end
  return s.replace(/(^\x00+)|(\x00+$)/g, '');
};
