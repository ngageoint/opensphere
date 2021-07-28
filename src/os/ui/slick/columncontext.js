goog.module('os.ui.slick.ColumnContext');
goog.module.declareLegacyNamespace();

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');
const {Controller: SlickGridCtrl} = goog.requireType('os.ui.slick.SlickGridUI');

/**
 * @typedef {{
 *   columns: Array<ColumnDefinition>,
 *   column: ColumnDefinition,
 *   grid: SlickGridCtrl
 * }}
 */
let ColumnContext;

exports = ColumnContext;
