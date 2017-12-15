goog.provide('os.ui.column.mapping.ColumnModelNode');
goog.require('os.column.ColumnModel');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree node representing a column model.
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.column.mapping.ColumnModelNode = function() {
  os.ui.column.mapping.ColumnModelNode.base(this, 'constructor');

  /**
   * @type {?os.column.ColumnModel}
   * @private
   */
  this['model'] = null;

  /**
   * @type {?os.column.IColumnMapping}
   * @private
   */
  this['mapping'] = null;

  /**
   * @type {function(): !Array.<!os.data.IDataDescriptor>}
   * @private
   */
  this['getFn'] = null;

  /**
   * @type {?os.ui.ogc.IOGCDescriptor}
   * @private
   */
  this['initialLayer'] = null;

  this.setCheckboxVisible(false);
};
goog.inherits(os.ui.column.mapping.ColumnModelNode, os.ui.slick.SlickTreeNode);


/**
 * Gets the column mapping associated with this node.
 * @return {?os.column.ColumnModel}
 */
os.ui.column.mapping.ColumnModelNode.prototype.getColumnModel = function() {
  return this['model'];
};


/**
 * Sets the column mapping on this node. This also creates
 * @param {?os.column.ColumnModel} value
 */
os.ui.column.mapping.ColumnModelNode.prototype.setColumnModel = function(value) {
  this['model'] = value;
};


/**
 * Get the mapping
 * @return {?os.column.IColumnMapping}
 */
os.ui.column.mapping.ColumnModelNode.prototype.getMapping = function() {
  return this['mapping'];
};


/**
 * Set the mapping
 * @param {?os.column.IColumnMapping} value
 */
os.ui.column.mapping.ColumnModelNode.prototype.setMapping = function(value) {
  this['mapping'] = value;
};


/**
 * Get the layer getter function
 * @return {function(): !Array.<!os.data.IDataDescriptor>}
 */
os.ui.column.mapping.ColumnModelNode.prototype.getGetFn = function() {
  return this['getFn'];
};


/**
 * Set the layer getter function
 * @param {function(): !Array.<!os.data.IDataDescriptor>} value
 */
os.ui.column.mapping.ColumnModelNode.prototype.setGetFn = function(value) {
  this['getFn'] = value;
};


/**
 * Get the initial layer
 * @return {?os.ui.ogc.IOGCDescriptor}
 */
os.ui.column.mapping.ColumnModelNode.prototype.getInitialLayer = function() {
  return this['initialLayer'];
};


/**
 * Set the initial layer
 * @param {?os.ui.ogc.IOGCDescriptor} value
 */
os.ui.column.mapping.ColumnModelNode.prototype.setInitialLayer = function(value) {
  this['initialLayer'] = value;
};


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnModelNode.prototype.updateFrom = function(other) {
  os.ui.column.mapping.ColumnModelNode.superClass_.updateFrom.call(this, other);
  var node = /** @type {os.ui.column.mapping.ColumnModelNode} */ (other);
  this.setColumnModel(node.getColumnModel());
  this.setMapping(node.getMapping());
  this.setGetFn(node.getGetFn());
  this.setInitialLayer(node.getInitialLayer());
};
