goog.module('os.histo.BinMethod');

const DateBinMethod = goog.require('os.histo.DateBinMethod');
const NumericBinMethod = goog.require('os.histo.NumericBinMethod');
const UniqueBinMethod = goog.require('os.histo.UniqueBinMethod');

const IBinMethod = goog.requireType('os.histo.IBinMethod');


/**
 * Bin methods available in the application.
 * @type {!Object<string, !function(new: IBinMethod)>}
 * @const
 */
exports = {
  'Unique': UniqueBinMethod,
  'Date': DateBinMethod,
  'Numeric': NumericBinMethod
};
