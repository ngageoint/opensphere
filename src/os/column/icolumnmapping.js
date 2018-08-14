goog.provide('os.column.ColumnModel');
goog.provide('os.column.IColumnMapping');
goog.require('goog.events.Listenable');
goog.require('os.IPersistable');


/**
 * @typedef {{
 *   column: string,
 *   layer: string,
 *   units: (string|undefined)
 * }}
 */
os.column.ColumnModel;



/**
 * Base interface representing a column mapping.
 * @extends {os.IPersistable}
 * @extends {goog.events.Listenable}
 * @interface
 */
os.column.IColumnMapping = function() {};


/**
 * Get the ID
 * @return {!string}
 */
os.column.IColumnMapping.prototype.getId;


/**
 * Set the ID
 * @param {!string} value
 */
os.column.IColumnMapping.prototype.setId;


/**
 * Get the value type
 * @return {?string}
 */
os.column.IColumnMapping.prototype.getValueType;


/**
 * Set the value type
 * @param {string} value
 */
os.column.IColumnMapping.prototype.setValueType;


/**
 * Get the name
 * @return {?string}
 */
os.column.IColumnMapping.prototype.getName;


/**
 * Set the name
 * @param {string} value
 */
os.column.IColumnMapping.prototype.setName;


/**
 * Get the description
 * @return {?string}
 */
os.column.IColumnMapping.prototype.getDescription;


/**
 * Set the description
 * @param {string} value
 */
os.column.IColumnMapping.prototype.setDescription;


/**
 * Adds a column by its layerKey and column field.
 * @param {string} layerKey The layer key
 * @param {string} column The column field string
 * @param {string=} opt_units The optional units to use
 */
os.column.IColumnMapping.prototype.addColumn;


/**
 * Removes a column model.
 * @param {os.column.ColumnModel} columnModel
 */
os.column.IColumnMapping.prototype.removeColumn;


/**
 * Gets the columns from the mapping.
 * @return {Array<os.column.ColumnModel>}
 */
os.column.IColumnMapping.prototype.getColumns;


/**
 * Gets a particular column model for a given layer key.
 * @param {string} layerKey
 * @return {?os.column.ColumnModel}
 */
os.column.IColumnMapping.prototype.getColumn;


/**
 * Clones the column mapping.
 * @return {os.column.IColumnMapping}
 */
os.column.IColumnMapping.prototype.clone;
