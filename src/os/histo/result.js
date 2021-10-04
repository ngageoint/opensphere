goog.declareModuleId('os.histo.Result');

const {default: Bin} = goog.requireType('os.histo.Bin');


/**
 * @typedef {{
 *  key: (string|number),
 *  value: !Bin
 * }}
 */
let Result;

export default Result;
