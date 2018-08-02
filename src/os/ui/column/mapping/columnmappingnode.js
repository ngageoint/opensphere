goog.provide('os.ui.column.mapping.ColumnMappingNode');
goog.require('os.ui.column.mapping.columnMappingNodeUIDirective');
goog.require('os.ui.slick.SlickTreeNode');



/**
 * Tree node representing a column mapping.
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.column.mapping.ColumnMappingNode = function() {
  os.ui.column.mapping.ColumnMappingNode.base(this, 'constructor');

  /**
   * @type {?os.column.IColumnMapping}
   * @private
   */
  this.cm_ = null;
  this.setCheckboxVisible(false);
  this.nodeUI = '<columnmappingnodeui></columnmappingnodeui>';
};
goog.inherits(os.ui.column.mapping.ColumnMappingNode, os.ui.slick.SlickTreeNode);


/**
 * Gets the column mapping associated with this node.
 * @return {?os.column.IColumnMapping}
 */
os.ui.column.mapping.ColumnMappingNode.prototype.getColumnMapping = function() {
  return this.cm_;
};


/**
 * Sets the column mapping on this node. This also creates
 * @param {?os.column.IColumnMapping} value
 */
os.ui.column.mapping.ColumnMappingNode.prototype.setColumnMapping = function(value) {
  if (value !== this.cm_) {
    this.setChildren(null);
  }

  this.cm_ = value;

  if (value) {
    var columns = value.getColumns();
    this.setLabel(value.getName());

    for (var i = 0, ii = columns.length; i < ii; i++) {
      var columnModel = columns[i];
      var layer = columnModel['layer'];
      var columnText = columnModel['column'];
      var label = columnText + ' (' + layer + ')';
      var node = new os.ui.slick.SlickTreeNode();

      if (layer.indexOf('!!') !== -1) {
        // construct a friendlier looking name
        var serverLayer = layer.split('!!');
        label = '<b>' + columnText + '</b>  (' + serverLayer[0] + ' - ' + serverLayer[1] + ')';
      }

      node.setLabel(label);
      node.setCheckboxVisible(false);
      this.addChild(node);
    }
  }
};


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnMappingNode.prototype.getLabel = function() {
  if (this.cm_) {
    return this.cm_.getName() || 'New Association';
  }

  return os.ui.column.mapping.ColumnMappingNode.superClass_.getLabel.call(this);
};


/**
 * @inheritDoc
 */
os.ui.column.mapping.ColumnMappingNode.prototype.updateFrom = function(other) {
  os.ui.column.mapping.ColumnMappingNode.superClass_.updateFrom.call(this, other);
  this.setColumnMapping(/** @type {os.ui.column.mapping.ColumnMappingNode} */ (other).getColumnMapping());
};
