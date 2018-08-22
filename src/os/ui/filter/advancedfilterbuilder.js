goog.provide('os.ui.filter.AdvancedFilterBuilderCtrl');
goog.provide('os.ui.filter.advancedFilterBuilderDirective');
goog.require('goog.array');
goog.require('goog.async.Delay');
goog.require('goog.dom');
goog.require('goog.dom.NodeType');
goog.require('goog.dom.xml');
goog.require('goog.log');
goog.require('os.metrics.Metrics');
goog.require('os.ui.Module');
goog.require('os.ui.filter.Expression');
goog.require('os.ui.filter.ui.ExpressionNode');
goog.require('os.ui.filter.ui.GroupNode');
goog.require('os.ui.window.confirmDirective');


/**
 * The advanced filter builder directive
 * @return {angular.Directive}
 */
os.ui.filter.advancedFilterBuilderDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: {
      'root': '=',
      'columns': '=',
      'viewonly': '=?'
    },
    templateUrl: os.ROOT + 'views/filter/advancedfilterbuilder.html',
    controller: os.ui.filter.AdvancedFilterBuilderCtrl,
    controllerAs: 'advCtrl'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('advancedfilterbuilder', [os.ui.filter.advancedFilterBuilderDirective]);



/**
 * Controller for the advanced filter builder
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @constructor
 * @ngInject
 */
os.ui.filter.AdvancedFilterBuilderCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @private
   */
  this.scope_ = $scope;

  /**
   * @type {goog.async.Delay}
   * @private
   */
  this.scrollDelay_ = new goog.async.Delay(this.onScrollDelay_, 50, this);

  /**
   * @type {?os.ui.slick.SlickTreeNode}
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
   * @type {?os.structs.ITreeNode}
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
};


/**
 * Logger for os.ui.filter.AdvancedFilterBuilderCtrl
 * @type {goog.log.Logger}
 * @private
 * @const
 */
os.ui.filter.AdvancedFilterBuilderCtrl.LOGGER_ = goog.log.getLogger('os.ui.filter.AdvancedFilterBuilderCtrl');


/**
 * Cleanup
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.onDestroy_ = function() {
  this.scope_ = null;
  goog.dispose(this.scrollDelay_);
  this.scrollDelay_ = null;
  os.ui.filter.AdvancedFilterBuilderCtrl.closeExprWindow_();
};


/**
 * @type {string}
 * @const
 */
os.ui.filter.AdvancedFilterBuilderCtrl.EXPR_WINDOW_ID = 'editExpr';


/**
 * Handles tab change events.
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.onTabChange_ = function() {
  this.updateTree_();
  this.onEditComplete_();
  os.ui.filter.AdvancedFilterBuilderCtrl.closeExprWindow_();
};


/**
 * Resets the tree array reference to force a tree update.
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.updateTree_ = function() {
  this['tree'] = [this.scope_['root']];
  this.scope_.$broadcast(os.ui.slick.SlickGridEvent.INVALIDATE_ROWS);
  this.scrollDelay_.start();
};


/**
 * Handles edit expression events
 * @param {angular.Scope.Event} event
 * @param {os.ui.filter.ui.ExpressionNode} node
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.onExprEdit_ = function(event, node) {
  this.edit(node.getExpression(), node);
};


/**
 * Updates the passed in treeNode with the new expr
 * @param {os.ui.filter.Expression} expr
 * @param {os.ui.filter.ui.ExpressionNode} treeNode
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.doEditExpr_ = function(expr, treeNode) {
  this.onEditComplete_();
  if (!this.scope_['viewonly']) {
    treeNode.setExpression(expr);
  }
  this.updateTree_();
};


/**
 * Get the parent node for an add operation. Gets the currently selected node in the tree, or the root node if there
 * isn't a selected node. Assumes multi-select is disabled, so if the selection is an array it will use the first node
 * in the array.
 *
 * @return {os.structs.ITreeNode}
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.getAddParent_ = function() {
  var item = this['selected'];
  if (goog.isArray(item)) {
    if (item.length > 0) {
      // pick the first one, though multi-select should be disabled
      item = /** @type {os.structs.ITreeNode} */ (item[0]);
    } else {
      item = null;
    }
  }

  if (!item) {
    item = /** @type {os.structs.ITreeNode} */ (this.scope_['root']);
  }

  return item;
};


/**
 * Callback for actually creating and adding the expression node
 * @param {os.ui.filter.Expression} expr
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.doAddExpr_ = function(expr) {
  this.onEditComplete_();

  var item = this.getAddParent_();
  if (item) {
    var parent = item instanceof os.ui.filter.ui.GroupNode ? item : item.getParent();
    var child = new os.ui.filter.ui.ExpressionNode();
    child.setExpression(expr);

    // add the child to the top of the children array and select it
    parent.addChild(child, undefined, 0);
    parent.collapsed = false;
    this.lastAddedNode_ = child;

    this.updateTree_();
  } else {
    // not expecting to get here, but log it if we do
    var msg = 'Failed adding expression. Unable to determine parent.';
    goog.log.error(os.ui.filter.AdvancedFilterBuilderCtrl.LOGGER_, msg);
  }
};


/**
 * Adds a new grouping node
 * @export
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.addGrouping = function() {
  this.onEditComplete_();

  var item = this.getAddParent_();
  if (item) {
    var parent = item instanceof os.ui.filter.ui.GroupNode ? item : item.getParent();
    var child = new os.ui.filter.ui.GroupNode();

    // add the child to the top of the children array and select it
    parent.addChild(child, undefined, 0);
    parent.collapsed = false;
    this.lastAddedNode_ = child;

    this.updateTree_();
  } else {
    // not expecting to get here, but log it if we do
    var msg = 'Failed adding group. Unable to determine parent.';
    goog.log.error(os.ui.filter.AdvancedFilterBuilderCtrl.LOGGER_, msg);
  }
};


/**
 * Adds a new expression node
 * @export
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.addExpr = function() {
  this.edit();
};


/**
 * Adds or edits an expression
 * @param {os.ui.filter.Expression=} opt_expr
 * @param {os.ui.filter.ui.ExpressionNode=} opt_node
 * @export
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.edit = function(opt_expr, opt_node) {
  if (os.ui.window.exists(os.ui.filter.AdvancedFilterBuilderCtrl.EXPR_WINDOW_ID)) {
    // don't open multiple of this window
    return;
  }

  var edit = !!opt_expr;
  this['editing'] = true;

  opt_expr = opt_expr ? opt_expr.clone() : new os.ui.filter.Expression();

  var scopeOptions = {
    'expr': opt_expr,
    'columns': this.scope_['columns']
  };

  if (scopeOptions['columns']) {
    scopeOptions['columns'].sort(os.ui.filter.AdvancedFilterBuilderCtrl.sortColumns);
  }

  os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
    confirm: edit && opt_node ? this.doEditExpr_.bind(this, opt_expr, opt_node) : this.doAddExpr_.bind(this, opt_expr),
    cancel: this.onEditComplete_.bind(this),
    prompt: '<expression expr="expr" columns="columns"></expression>',
    windowOptions: {
      'id': os.ui.filter.AdvancedFilterBuilderCtrl.EXPR_WINDOW_ID,
      'x': 'center',
      'y': 'center',
      'label': (edit ? 'Edit' : 'Add') + ' Expression',
      'show-close': false,
      'no-scroll': true,
      'width': 750,
      'min-width': 500,
      'max-widith': 1000,
      'height': 'auto',
      'icon': 'fa fa-file',
      'modal': 'true'
    }
  }), scopeOptions);
};


/**
 * Returns whether the currently selected node is removable
 * @return {boolean}
 * @export
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.canRemove = function() {
  return this['selected'] && this['selected'] !== this.scope_['root'];
};


/**
 * Removes the currently selected node.
 * @export
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.remove = function() {
  if (this.canRemove()) {
    this.scope_.$emit('filterbuilder.remove', this['selected']);
  }
};


/**
 * Callback for edit completion. Reenables the buttons on the form.
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.onEditComplete_ = function() {
  this['editing'] = false;
};


/**
 * Scrolls to the last node
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.prototype.onScrollDelay_ = function() {
  if (this.lastAddedNode_) {
    this['selected'] = this.lastAddedNode_;
    this.scope_.$broadcast(os.ui.slick.SlickGridEvent.SCROLL_TO, this.lastAddedNode_);
    this.lastAddedNode_ = null;
    os.ui.apply(this.scope_);
  }
};


/**
 * @param {os.ogc.FeatureTypeColumn} a
 * @param {os.ogc.FeatureTypeColumn} b
 * @return {number} -1, 0, or 1 per typical compare functions
 */
os.ui.filter.AdvancedFilterBuilderCtrl.sortColumns = function(a, b) {
  return goog.string.caseInsensitiveCompare(a.name, b.name);
};


/**
 * Closes the expression edit window.
 * @private
 */
os.ui.filter.AdvancedFilterBuilderCtrl.closeExprWindow_ = function() {
  var childWindow = angular.element('#' + os.ui.filter.AdvancedFilterBuilderCtrl.EXPR_WINDOW_ID);
  if (childWindow) {
    os.ui.window.close(childWindow);
  }
};
