goog.declareModuleId('os.column.IColumnMapping');

const Listenable = goog.requireType('goog.events.Listenable');
const {default: IPersistable} = goog.requireType('os.IPersistable');


/**
 * Base interface representing a column mapping.
 *
 * @extends {IPersistable}
 * @extends {Listenable}
 * @interface
 */
export default class IColumnMapping {
  /**
   * Get the ID
   * @return {!string}
   */
  getId() {}

  /**
   * Set the ID
   * @param {!string} value
   */
  setId(value) {}

  /**
   * Get the value type
   * @return {?string}
   */
  getValueType() {}

  /**
   * Set the value type
   * @param {string} value
   */
  setValueType(value) {}

  /**
   * Get the name
   * @return {?string}
   */
  getName() {}

  /**
   * Set the name
   * @param {string} value
   */
  setName(value) {}

  /**
   * Get the description
   * @return {?string}
   */
  getDescription() {}

  /**
   * Set the description
   * @param {string} value
   */
  setDescription(value) {}

  /**
   * Adds a column by its layerKey and column field.
   * @param {string} layerKey The layer key
   * @param {string} column The column field string
   * @param {string=} opt_units The optional units to use
   */
  addColumn(layerKey, column, opt_units) {}

  /**
   * Removes a column model.
   * @param {osx.column.ColumnModel} columnModel
   */
  removeColumn(columnModel) {}

  /**
   * Gets the columns from the mapping.
   * @return {Array<osx.column.ColumnModel>}
   */
  getColumns() {}

  /**
   * Gets a particular column model for a given layer key.
   * @param {string} layerKey
   * @return {?osx.column.ColumnModel}
   */
  getColumn(layerKey) {}

  /**
   * Clones the column mapping.
   * @return {IColumnMapping}
   */
  clone() {}

  /**
   * Writes raw XML mapping data
   * @return {string}
   */
  writeMapping() {}
}
