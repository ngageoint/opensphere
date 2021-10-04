goog.declareModuleId('os.ui.columnactions.IColumnActionModel');

/**
 * The interface that should be implemented by all column types that want to use a column action.
 * Describes technology agnostic model for a table column.
 *
 * @interface
 */
export default class IColumnActionModel {
  /**
   * Get the column title
   * @return {string}
   */
  getTitle() {}

  /**
   * Get the name of the dataField supporting the column.
   * @return {string}
   */
  getDataField() {}
}
