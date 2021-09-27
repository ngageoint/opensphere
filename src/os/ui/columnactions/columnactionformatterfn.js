goog.declareModuleId('os.ui.columnactions.ColumnActionFormatterFn');

const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Typedef for column action formatter functions.
 * @typedef {function(number, number, string, Object, SlickTreeNode, boolean=):string}
 */
let ColumnActionFormatterFn;

export default ColumnActionFormatterFn;
