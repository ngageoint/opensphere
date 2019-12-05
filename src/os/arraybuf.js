goog.module('os.arraybuf');
goog.module.declareLegacyNamespace();

goog.require('goog.array');


/**
 * The Byte Order Marker (BOM) sequence.
 * @type {!Array<number>}
 */
const BYTE_ORDER_MARKER = [0xef, 0xbb, 0xbf];


/**
 * Enumeration of magic numbers for array buffer type checking.
 * @enum {number}
 */
const MagicNumber = {
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
 * @deprecated Please use Boolean(os.file.mime.text.getText()) instead
 */
const isText = function(ab) {
  // If UTF-8 Byte Order Mark exists
  if (goog.array.equals(new Uint8Array(ab.slice(0, 3)), BYTE_ORDER_MARKER)) {
    // just assume it is text
    return true;
  }

  const dv = new DataView(ab);
  const n = Math.min(64000, dv.byteLength);
  const has32 = n >= 4;

  if (n == 0) {
    // empty files are considered text
    return true;
  }

  if (has32 && dv.getUint32(0) == MagicNumber.ZIP) {
    // zip files are considered binary regardless of contents
    return false;
  }

  let nonTextBytes = 0;
  const pdfMax = Math.min(1021, n - 3);
  for (let i = 0; i < n; i++) {
    if (has32 && i < pdfMax) {
      // PDF magic number can occur anywhere in the first 1024 bytes according to the spec, so check each one
      const int32 = dv.getUint32(i);
      if (int32 === MagicNumber.PDF) {
        // PDF files are also considered binary regardless of contents
        return false;
      }
    }

    const b = dv.getUint8(i);

    if (b == 0) {
      // files with null bytes are likely binary
      return false;
    }

    if (!isTextCharacter(b)) {
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
 *
 * @param {number} b The byte
 * @return {boolean}
 * @deprecated Please see the os.file.mime.text package instead
 */
const isTextCharacter = function(b) {
  return b == 10 || b == 13 || b == 9 || b == 8 || (b >= 32 && b <= 127);
};


/**
 * Converts an ArrayBuffer into a UTF-8 string.
 *
 * @param {ArrayBuffer} ab The buffer
 * @return {string} The string
 * @deprecated Please use os.file.mime.text.getText() instead
 */
const toString = function(ab) {
  let s = '';
  // strip the BOM if the content has one
  if (goog.array.equals(new Uint8Array(ab.slice(0, 3)), BYTE_ORDER_MARKER)) {
    ab = ab.slice(3);
  }

  // TextDecoder.decode only works with a DataView in earlier versions of Firefox
  const dv = new DataView(ab);

  const toTry = ['utf-8', 'latin2', 'latin3', 'latin4', 'cyrillic', 'utf-16'];
  for (let i = 0, ii = toTry.length; i < ii; i++) {
    // this is poly-filled by the text-encoding package
    const decoder = new TextDecoder(toTry[i], {fatal: true});

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

exports = {BYTE_ORDER_MARKER, MagicNumber, isText, isTextCharacter, toString};
