goog.provide('os.ui.columnactions.IColumnActionModel');



/**
 * The interface that should be implemented by all column types that want to use a column action.
 * Describes technology agnostic model for a table column.
 * @interface
 */
os.ui.columnactions.IColumnActionModel = function() {};


/**
 * Get the column title
 * @return {string}
 */
os.ui.columnactions.IColumnActionModel.prototype.getTitle;


/**
 * Get the name of the dataField supporting the column.
 * @return {string}
 */
os.ui.columnactions.IColumnActionModel.prototype.getDataField;
