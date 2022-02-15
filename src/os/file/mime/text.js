goog.declareModuleId('os.file.mime.text');

import * as mime from '../mime.js';

const Promise = goog.require('goog.Promise');
const log = goog.require('goog.log');

const Logger = goog.requireType('goog.log.Logger');
const {default: OSFile} = goog.requireType('os.file.File');


/**
 * @type {string}
 */
export const TYPE = 'text/plain';

/**
 * Priority for text detection.
 * @type {number}
 */
export const PRIORITY = 1000;

/**
 * The Byte Order Marker (BOM) sequence.
 * @type {!Array<number>}
 */
export const UTF8_BYTE_ORDER_MARKER = [0xef, 0xbb, 0xbf];

/**
 * @type {!Array<number>}
 */
export const UTF16_BYTE_ORDER_MARKER_BE = [0xfe, 0xff];

/**
 * @type {!Array<number>}
 */
export const UTF16_BYTE_ORDER_MARKER_LE = [0xff, 0xfe];

/**
 * @type {!Array<!Array<number>>}
 */
export const BOMS_ = [UTF8_BYTE_ORDER_MARKER, UTF16_BYTE_ORDER_MARKER_LE, UTF16_BYTE_ORDER_MARKER_BE];

/**
 * The logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.file.mime.text');

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {string|undefined}
 */
export const getText = function(buffer, opt_file) {
  if (buffer) {
    var s = hasDeclaredEncoding_(buffer, opt_file);

    if (!s) {
      var arr = new Uint8Array(buffer);
      var encoding = chardetng.detect(arr);
      if (encoding) {
        // strip any UTF BOMs before decoding
        var boms = BOMS_;
        for (var i = 0, n = boms.length; i < n; i++) {
          var bom = boms[i];
          if (arr.length >= bom.length && arr.slice(0, bom.length).every((el, i) => el === bom[i])) {
            buffer = buffer.slice(bom.length);
            break;
          }
        }

        s = decode_(buffer, encoding);
        if (opt_file) {
          opt_file.setEncoding(encoding);
        }
      }
    }

    if (s) {
      // trim nulls from the beginning/end
      s = s.replace(/(^\x00+)|(\x00+$)/g, '');
    }

    return s;
  }
};

/**
 * Gets an ArrayBuffer from a string of text.
 *
 * @param {string} text
 * @return {ArrayBuffer|undefined}
 */
export const getArrayBuffer = function(text) {
  try {
    var encoder = new TextEncoder();
    var arr = encoder.encode(text);
    return arr.buffer;
  } catch (e) {
    log.error(logger, 'Failed to create ArrayBuffer from string.', e);
  }
};

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {!Promise<string|undefined>}
 */
export const detectText = function(buffer, opt_file) {
  return Promise.resolve(getText(buffer, opt_file));
};

mime.register(TYPE, detectText, PRIORITY);


/**
 * @param {ArrayBuffer} buffer
 * @param {string} encoding
 * @return {string|undefined}
 */
const decode_ = function(buffer, encoding) {
  try {
    return new TextDecoder(encoding.toLowerCase()).decode(new DataView(buffer));
  } catch (e) {
    var msg = 'No TextDecoder could be found for the encoding ' + encoding.toLowerCase();
    log.error(logger, msg);
  }
};

/**
 * @param {ArrayBuffer} buffer
 * @param {OSFile=} opt_file
 * @return {string|undefined}
 */
const hasDeclaredEncoding_ = function(buffer, opt_file) {
  if (opt_file) {
    var encoding = opt_file.getEncoding();
    if (encoding) {
      return decode_(buffer, encoding);
    }
  }
};
