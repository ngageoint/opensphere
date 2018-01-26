goog.provide('os.ui.filter.ui.ExpressionNode');

goog.require('os.ui.filter.Expression');
goog.require('os.ui.filter.ui.expressionNodeUIDirective');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.column');



/**
 * Tree node representing an expression in an advanced filter.
 * @param {boolean=} opt_viewonly
 * @extends {os.ui.slick.SlickTreeNode}
 * @constructor
 */
os.ui.filter.ui.ExpressionNode = function(opt_viewonly) {
  os.ui.filter.ui.ExpressionNode.base(this, 'constructor');

  /**
   * The type of the node, used for validation of the tree.
   * @type {string}
   */
  this.nodeType = 'expression';

  /**
   * @type {?os.ui.filter.Expression}
   * @private
   */
  this.expr_ = null;
  this.setCheckboxVisible(false);
  if (opt_viewonly) {
    this.nodeUI = '<expressionnodeviewui></expressionnodeviewui>';
  } else {
    this.nodeUI = '<expressionnodeui></expressionnodeui>';
  }
  this.childrenAllowed = false;
};
goog.inherits(os.ui.filter.ui.ExpressionNode, os.ui.slick.SlickTreeNode);


/**
 * @return {?os.ui.filter.Expression}
 */
os.ui.filter.ui.ExpressionNode.prototype.getExpression = function() {
  return this.expr_;
};
goog.exportProperty(
    os.ui.filter.ui.ExpressionNode.prototype,
    'getExpression',
    os.ui.filter.ui.ExpressionNode.prototype.getExpression);


/**
 * @param {?os.ui.filter.Expression} value
 */
os.ui.filter.ui.ExpressionNode.prototype.setExpression = function(value) {
  this.expr_ = value;
};


/**
 * Writes out the filter from the expression.
 * @return {string}
 */
os.ui.filter.ui.ExpressionNode.prototype.writeFilter = function() {
  var ret = '';

  if (this.expr_) {
    ret = this.expr_.getFilter() || '';
  }

  return ret;
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.ExpressionNode.prototype.getLabel = function() {
  if (this.expr_ && this.expr_['column']) {
    var name = this.expr_['column']['name'];
    var title = this.expr_['op'].getTitle();
    var literal = this.expr_['op'].getExcludeLiteral() ? '' : this.expr_['literal'] || '';
    return name + ' <b>' + title + '</b> ' + literal;
  }

  return os.ui.filter.ui.ExpressionNode.superClass_.getLabel.call(this);
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.ExpressionNode.prototype.formatIcons = function() {
  return '<i class="fa fa-fw fa-file" style="margin-right:5px;"></i>';
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.ExpressionNode.prototype.updateFrom = function(other) {
  os.ui.filter.ui.ExpressionNode.superClass_.updateFrom.call(this, other);
  this.setExpression(/** @type {os.ui.filter.ui.ExpressionNode} */ (other).getExpression());
};


/**
 * @inheritDoc
 */
os.ui.filter.ui.ExpressionNode.prototype.format = function(row, cell, value) {
  var html = this.formatNodeUI();
  html += this.getSpacer(20 * this.depth);
  html += '<nodetoggle></nodetoggle>';
  html += '<nodeicons></nodeicons>';
  html += this.getLabel();
  return html;
};


/**
 * Creates and sets up an expression node from a filter
 * @param {Node} filter The filter Element
 * @param {Array<!os.data.ColumnDefinition>} cols
 * @param {boolean=} opt_viewonly
 * @return {!os.ui.filter.ui.ExpressionNode}
 */
os.ui.filter.ui.ExpressionNode.createExpressionNode = function(filter, cols, opt_viewonly) {
  var node = new os.ui.filter.ui.ExpressionNode(opt_viewonly);
  var expr = new os.ui.filter.Expression();
  node.setExpression(expr);
  expr.setFilter(filter);

  if (expr.columnName && !expr['column']) {
    expr['column'] = os.ui.slick.column.findColumn(cols, expr.columnName);
  }

  return node;
};
