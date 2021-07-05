goog.module('os.ui.columnactions.IColumnActionModel');
goog.module.declareLegacyNamespace();

/**
 * The interface that should be implemented by all column types that want to use a column action.
 * Describes technology agnostic model for a table column.
 *
 * @interface
 */
class IColumnActionModel {
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

exports = IColumnActionModel;
