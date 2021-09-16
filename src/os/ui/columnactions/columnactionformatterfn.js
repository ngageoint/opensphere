goog.module('os.ui.columnactions.ColumnActionFormatterFn');

const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Typedef for column action formatter functions.
 * @typedef {function(number, number, string, Object, SlickTreeNode, boolean=):string}
 */
let ColumnActionFormatterFn;

exports = ColumnActionFormatterFn;
