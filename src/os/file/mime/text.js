goog.provide('os.file.mime.text');

goog.require('goog.Promise');
goog.require('goog.array');
goog.require('goog.log');
goog.require('goog.log.Logger');
goog.require('os.file.mime');


/**
 * @const
 * @type {string}
 */
os.file.mime.text.TYPE = 'text/plain';

/**
 * The Byte Order Marker (BOM) sequence.
 * @type {!Array<number>}
 * @const
 */
os.file.mime.text.UTF8_BYTE_ORDER_MARKER = [0xef, 0xbb, 0xbf];

/**
 * @type {!Array<number>}
 * @const
 */
os.file.mime.text.UTF16_BYTE_ORDER_MARKER_BE = [0xfe, 0xff];

/**
 * @type {!Array<number>}
 * @const
 */
os.file.mime.text.UTF16_BYTE_ORDER_MARKER_LE = [0xff, 0xfe];


/**
 * @const
 * @type {!Array<!Array<number>>}
 */
os.file.mime.text.BOMS_ = [
  os.file.mime.text.UTF8_BYTE_ORDER_MARKER,
  os.file.mime.text.UTF16_BYTE_ORDER_MARKER_LE,
  os.file.mime.text.UTF16_BYTE_ORDER_MARKER_BE];


/**
 * The logger.
 * @type {goog.debug.Logger}
 * @const
 * @private
 */
os.file.mime.text.LOGGER_ = goog.log.getLogger('os.file.mime.text');



/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {string|undefined}
 */
os.file.mime.text.getText = function(buffer, opt_file) {
  if (buffer) {
    var s = os.file.mime.text.hasDeclaredEncoding_(buffer, opt_file);

    if (!s) {
      // I'm aware this looks dumb and doubles the memory, but jschardet lacks the ability
      // to take a typed array as input.
      var binaryString = '';
      var arr = new Uint8Array(buffer);
      // Don't send jschardet more than 16KB of data. It is pretty sluggish on large files
      var max = Math.min(arr.length, 16 * 1024);
      for (var i = 0; i < max; i++) {
        binaryString += String.fromCharCode(arr[i]);
      }

      var encoding = jschardet.detect(binaryString).encoding;
      if (encoding) {
        // strip any UTF BOMs before decoding
        var boms = os.file.mime.text.BOMS_;
        var n;
        for (i = 0, n = boms.length; i < n; i++) {
          var bom = boms[i];
          if (arr.length >= bom.length && goog.array.equals(arr.slice(0, bom.length), bom)) {
            buffer = buffer.slice(bom.length);
            break;
          }
        }

        s = os.file.mime.text.decode_(buffer, encoding);
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
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {!goog.Promise<string|undefined>}
 */
os.file.mime.text.detectText = function(buffer, opt_file) {
  return goog.Promise.resolve(os.file.mime.text.getText(buffer, opt_file));
};

os.file.mime.register(os.file.mime.text.TYPE, os.file.mime.text.detectText, 1000);


/**
 * @param {ArrayBuffer} buffer
 * @param {string} encoding
 * @return {string|undefined}
 * @private
 */
os.file.mime.text.decode_ = function(buffer, encoding) {
  try {
    return new TextDecoder(encoding.toLowerCase()).decode(new DataView(buffer));
  } catch (e) {
    var msg = 'No TextDecoder could be found for the encoding ' + encoding.toLowerCase();
    goog.log.error(os.file.mime.text.LOGGER_, msg);
  }
};


/**
 * @param {ArrayBuffer} buffer
 * @param {os.file.File=} opt_file
 * @return {string|undefined}
 * @private
 */
os.file.mime.text.hasDeclaredEncoding_ = function(buffer, opt_file) {
  if (opt_file) {
    var encoding = opt_file.getEncoding();
    if (encoding) {
      return os.file.mime.text.decode_(buffer, encoding);
    }
  }
};
