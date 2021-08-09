goog.module('os.ui.filter.AdvancedFilterBuilderUI');
goog.module.declareLegacyNamespace();

const Delay = goog.require('goog.async.Delay');
const dispose = goog.require('goog.dispose');
const log = goog.require('goog.log');
const {caseInsensitiveCompare} = goog.require('goog.string');
const {ROOT} = goog.require('os');
const {apply} = goog.require('os.ui');
const Module = goog.require('os.ui.Module');
const Expression = goog.require('os.ui.filter.Expression');
const ExpressionNode = goog.require('os.ui.filter.ui.ExpressionNode');
const {directiveTag: expressionUi} = goog.require('os.ui.filter.ExpressionUI');
const GroupNode = goog.require('os.ui.filter.ui.GroupNode');
const SlickGridEvent = goog.require('os.ui.slick.SlickGridEvent');
const {close, exists} = goog.require('os.ui.window');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const Logger = goog.requireType('goog.log.Logger');
const FeatureTypeColumn = goog.requireType('os.ogc.FeatureTypeColumn');
const ITreeNode = goog.requireType('os.structs.ITreeNode');
const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The advanced filter builder directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: {
    'root': '=',
    'columns': '=',
    'viewonly': '=?'
  },
  templateUrl: ROOT + 'views/filter/advancedfilterbuilder.html',
  controller: Controller,
  controllerAs: 'advCtrl'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'advancedfilterbuilder';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the advanced filter builder
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @ngInject
   */
  constructor($scope, $element) {
    /**
     * @type {?angular.Scope}
     * @private
     */
    this.scope_ = $scope;

    /**
     * @type {Delay}
     * @private
     */
    this.scrollDelay_ = new Delay(this.onScrollDelay_, 50, this);

    /**
     * @type {?SlickTreeNode}
     * @private
     */
    this.lastAddedNode_ = null;

    /**
     * @type {Object}
     */
    this['gridOptions'] = {
      'multiSelect': false
    };

    /**
     * @type {Array}
     */
    this['tree'] = [];

    /**
     * @type {?ITreeNode}
     */
    this['selected'] = null;

    /**
     * @type {boolean}
     */
    this['editing'] = false;

    this.updateTree_();

    $scope.$on('tabChange', this.onTabChange_.bind(this));
    $scope.$on('advancedfilterbuilder.editExpr', this.onExprEdit_.bind(this));
    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleanup
   *
   * @private
   */
  onDestroy_() {
    this.scope_ = null;
    dispose(this.scrollDelay_);
    this.scrollDelay_ = null;
    Controller.closeExprWindow_();
  }

  /**
   * Handles tab change events.
   *
   * @private
   */
  onTabChange_() {
    this.updateTree_();
    this.onEditComplete_();
    Controller.closeExprWindow_();
  }

  /**
   * Resets the tree array reference to force a tree update.
   *
   * @private
   */
  updateTree_() {
    this['tree'] = [this.scope_['root']];
    this.scope_.$broadcast(SlickGridEvent.INVALIDATE_ROWS);
    this.scrollDelay_.start();
  }

  /**
   * Handles edit expression events
   *
   * @param {angular.Scope.Event} event
   * @param {ExpressionNode} node
   * @private
   */
  onExprEdit_(event, node) {
    this.edit(node.getExpression(), node);
  }

  /**
   * Updates the passed in treeNode with the new expr
   *
   * @param {Expression} expr
   * @param {ExpressionNode} treeNode
   * @private
   */
  doEditExpr_(expr, treeNode) {
    this.onEditComplete_();
    if (!this.scope_['viewonly']) {
      treeNode.setExpression(expr);
    }
    this.updateTree_();
  }

  /**
   * Get the parent node for an add operation. Gets the currently selected node in the tree, or the root node if there
   * isn't a selected node. Assumes multi-select is disabled, so if the selection is an array it will use the first node
   * in the array.
   *
   * @return {ITreeNode}
   * @private
   */
  getAddParent_() {
    var item = this['selected'];
    if (Array.isArray(item)) {
      if (item.length > 0) {
        // pick the first one, though multi-select should be disabled
        item = /** @type {ITreeNode} */ (item[0]);
      } else {
        item = null;
      }
    }

    if (!item) {
      item = /** @type {ITreeNode} */ (this.scope_['root']);
    }

    return item;
  }

  /**
   * Callback for actually creating and adding the expression node
   *
   * @param {Expression} expr
   * @private
   */
  doAddExpr_(expr) {
    this.onEditComplete_();

    var item = this.getAddParent_();
    if (item) {
      var parent = item instanceof GroupNode ? item : item.getParent();
      var child = new ExpressionNode();
      child.setExpression(expr);

      // add the child to the top of the children array and select it
      parent.addChild(child, undefined, 0);
      parent.collapsed = false;
      this.lastAddedNode_ = child;

      this.updateTree_();
    } else {
      // not expecting to get here, but log it if we do
      var msg = 'Failed adding expression. Unable to determine parent.';
      log.error(logger, msg);
    }
  }

  /**
   * Adds a new grouping node
   *
   * @export
   */
  addGrouping() {
    this.onEditComplete_();

    var item = this.getAddParent_();
    if (item) {
      var parent = item instanceof GroupNode ? item : item.getParent();
      var child = new GroupNode();

      // add the child to the top of the children array and select it
      parent.addChild(child, undefined, 0);
      parent.collapsed = false;
      this.lastAddedNode_ = child;

      this.updateTree_();
    } else {
      // not expecting to get here, but log it if we do
      var msg = 'Failed adding group. Unable to determine parent.';
      log.error(logger, msg);
    }
  }

  /**
   * Adds a new expression node
   *
   * @export
   */
  addExpr() {
    this.edit();
  }

  /**
   * Adds or edits an expression
   *
   * @param {Expression=} opt_expr
   * @param {ExpressionNode=} opt_node
   * @export
   */
  edit(opt_expr, opt_node) {
    if (exists(Controller.EXPR_WINDOW_ID)) {
      // don't open multiple of this window
      return;
    }

    var edit = !!opt_expr;
    this['editing'] = true;

    opt_expr = opt_expr ? opt_expr.clone() : new Expression();

    var scopeOptions = {
      'expr': opt_expr,
      'columns': this.scope_['columns']
    };

    if (scopeOptions['columns']) {
      scopeOptions['columns'].sort(Controller.sortColumns);
    }

    ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: edit && opt_node ?
        this.doEditExpr_.bind(this, opt_expr, opt_node) : this.doAddExpr_.bind(this, opt_expr),
      cancel: this.onEditComplete_.bind(this),
      prompt: `<${expressionUi} expr="expr" columns="columns"></${expressionUi}>`,
      windowOptions: {
        'id': Controller.EXPR_WINDOW_ID,
        'x': 'center',
        'y': 'center',
        'label': (edit ? 'Edit' : 'Add') + ' Expression',
        'show-close': false,
        'width': 850,
        'min-width': 500,
        'max-widith': 1000,
        'height': 'auto',
        'icon': 'fa fa-file',
        'modal': 'true'
      }
    }), scopeOptions);
  }

  /**
   * Returns whether the currently selected node is removable
   *
   * @return {boolean}
   * @export
   */
  canRemove() {
    return this['selected'] && this['selected'] !== this.scope_['root'];
  }

  /**
   * Removes the currently selected node.
   *
   * @export
   */
  remove() {
    if (this.canRemove()) {
      this.scope_.$emit('filterbuilder.remove', this['selected']);
    }
  }

  /**
   * Callback for edit completion. Reenables the buttons on the form.
   *
   * @private
   */
  onEditComplete_() {
    this['editing'] = false;
  }

  /**
   * Scrolls to the last node
   *
   * @private
   */
  onScrollDelay_() {
    if (this.lastAddedNode_) {
      this['selected'] = this.lastAddedNode_;
      this.scope_.$broadcast(SlickGridEvent.SCROLL_TO, this.lastAddedNode_);
      this.lastAddedNode_ = null;
      apply(this.scope_);
    }
  }

  /**
   * @param {FeatureTypeColumn} a
   * @param {FeatureTypeColumn} b
   * @return {number} -1, 0, or 1 per typical compare functions
   */
  static sortColumns(a, b) {
    return caseInsensitiveCompare(a.name, b.name);
  }

  /**
   * Closes the expression edit window.
   *
   * @private
   */
  static closeExprWindow_() {
    var childWindow = angular.element('#' + Controller.EXPR_WINDOW_ID);
    if (childWindow) {
      close(childWindow);
    }
  }
}

/**
 * Logger.
 * @type {Logger}
 */
const logger = log.getLogger('os.ui.filter.AdvancedFilterBuilderUI');

/**
 * @type {string}
 * @const
 */
Controller.EXPR_WINDOW_ID = 'editExpr';

exports = {
  Controller,
  directive,
  directiveTag
};
