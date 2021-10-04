goog.declareModuleId('os.histo.BinMethod');

import DateBinMethod from './datebinmethod.js';
import NumericBinMethod from './numericbinmethod.js';
import UniqueBinMethod from './uniquebinmethod.js';

const {default: IBinMethod} = goog.requireType('os.histo.IBinMethod');


/**
 * Bin methods available in the application.
 * @type {!Object<string, !function(new: IBinMethod)>}
 * @const
 */
const BinMethod = {
  'Unique': UniqueBinMethod,
  'Date': DateBinMethod,
  'Numeric': NumericBinMethod
};

export default BinMethod;
