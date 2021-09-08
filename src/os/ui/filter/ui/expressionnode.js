goog.module('os.ui.filter.ui.ExpressionNode');

const RecordField = goog.require('os.data.RecordField');
const {humanize} = goog.require('os.time');
const Expression = goog.require('os.ui.filter.Expression');
const Between = goog.require('os.ui.filter.op.time.Between');
const {directiveTag: nodeUi} = goog.require('os.ui.filter.ui.ExpressionNodeUI');
const {directiveTag: nodeViewUi} = goog.require('os.ui.filter.ui.ExpressionNodeViewUI');
const SlickTreeNode = goog.require('os.ui.slick.SlickTreeNode');
const {findColumn} = goog.require('os.ui.slick.column');

const ColumnDefinition = goog.requireType('os.data.ColumnDefinition');


/**
 * Tree node representing an expression in an advanced filter.
 */
class ExpressionNode extends SlickTreeNode {
  /**
   * Constructor.
   * @param {boolean=} opt_viewonly
   */
  constructor(opt_viewonly) {
    super();

    /**
     * The type of the node, used for validation of the tree.
     * @type {string}
     */
    this.nodeType = 'expression';

    /**
     * @type {?Expression}
     * @private
     */
    this.expr_ = null;
    this.setCheckboxVisible(false);
    if (opt_viewonly) {
      this.nodeUI = `<${nodeViewUi}></${nodeViewUi}>`;
    } else {
      this.nodeUI = `<${nodeUi}></${nodeUi}>`;
    }
    this.childrenAllowed = false;
  }

  /**
   * @return {?Expression}
   * @export
   */
  getExpression() {
    return this.expr_;
  }

  /**
   * @param {?Expression} value
   */
  setExpression(value) {
    this.expr_ = value;
  }

  /**
   * Writes out the filter from the expression.
   *
   * @return {string}
   */
  writeFilter() {
    var ret = '';

    if (this.expr_) {
      ret = this.expr_.getFilter() || '';
    }

    return ret;
  }

  /**
   * @inheritDoc
   */
  getLabel() {
    if (this.expr_ && this.expr_['column']) {
      var field = this.expr_['column']['field'];
      var name = this.expr_['column']['name'];
      var title = this.expr_['op'].getTitle();
      var label = name + ' <b>' + title + '</b> ';
      var literal = this.expr_['op'].getExcludeLiteral() ? '' : this.expr_['literal'] || '';

      if (field === RecordField.TIME) {
        // times are stored in ms, which doesn't display nicely in the advanced filter tree, so clean it up
        // the literal is stored is a string, so parse it into a number
        var time = parseFloat(literal);

        if (!isNaN(time)) {
          var readable;

          if (this.expr_['op'] instanceof Between) {
            var range = this.expr_['op'].getRangeFromLiteral(literal);
            var start = moment.duration(range[0]);
            var end = moment.duration(range[1]);
            readable = humanize(start) + ' and ' + humanize(end);
          } else {
            var duration = moment.duration(time);
            readable = humanize(duration);
          }

          return label + readable;
        }
      } else {
        return label + literal;
      }
    }

    return super.getLabel();
  }

  /**
   * @inheritDoc
   */
  formatIcons() {
    return '<i class="fa fa-fw fa-file mr-1"></i>';
  }

  /**
   * @inheritDoc
   */
  updateFrom(other) {
    super.updateFrom(other);
    this.setExpression(/** @type {ExpressionNode} */ (other).getExpression());
  }

  /**
   * @inheritDoc
   */
  format(row, cell, value) {
    var html = this.getSpacer(20 * this.depth);
    html += '<nodetoggle></nodetoggle>';
    html += '<nodeicons></nodeicons>';
    html += '<span class="text-truncate flex-fill">' + this.getLabel() + '</span>';
    html += this.formatNodeUI();
    return html;
  }

  /**
   * Creates and sets up an expression node from a filter
   *
   * @param {Node} filter The filter Element
   * @param {Array<!ColumnDefinition>} cols
   * @param {boolean=} opt_viewonly
   * @return {!ExpressionNode}
   */
  static createExpressionNode(filter, cols, opt_viewonly) {
    var node = new ExpressionNode(opt_viewonly);
    var expr = new Expression();
    node.setExpression(expr);
    expr.setFilter(filter);

    if (expr.columnName && !expr['column']) {
      expr['column'] = findColumn(cols, expr.columnName);
    }

    return node;
  }
}

exports = ExpressionNode;
