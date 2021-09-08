goog.module('os.ui.filter.ui.CopyFilterPickerModel');

const ColumnMapping = goog.requireType('os.column.ColumnMapping');


/**
 * @typedef {{
 *   name: string,
 *   mapping: (ColumnMapping|undefined),
 *   targetFilterKey: string,
 *   sourceColumnName: string,
 *   targetColumns: Array<Object>,
 *   selectedTargetColumn: Object
 * }}
 */
let CopyFilterPickerModel;

exports = CopyFilterPickerModel;
