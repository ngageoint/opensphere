goog.provide('os.ui.filter.ui.ViewFiltersCtrl');
goog.provide('os.ui.filter.ui.viewFiltersDirective');
goog.require('os.filter.IFilterEntry');
goog.require('os.metrics.Metrics');
goog.require('os.metrics.keys');
goog.require('os.ui.Module');
goog.require('os.ui.filter');
goog.require('os.ui.filter.advancedFilterBuilderDirective');
goog.require('os.ui.filter.basicFilterBuilderDirective');
goog.require('os.ui.filter.ui.GroupNode');
goog.require('os.ui.window');


/**
 * The filter window directive
 * @return {angular.Directive}
 */
os.ui.filter.ui.viewFiltersDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/filter/viewfilters.html',
    controller: os.ui.filter.ui.ViewFiltersCtrl,
    controllerAs: 'filters'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('viewfilter', [os.ui.filter.ui.viewFiltersDirective]);



/**
 * Controller for the filters window.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.ViewFiltersCtrl = function($scope, $element) {
  /**
   * @type {?angular.Scope}
   * @protected
   */
  this.scope = $scope;

  /**
   * @type {?angular.JQLite}
   * @protected
   */
  this.element = $element;

  /**
   * @type {os.filter.FilterEntry}
   * @protected
   */
  this.entry = /** @type {os.filter.FilterEntry} */ ($scope['entry']);

  /**
   * @type {?os.ui.filter.ui.GroupNode}
   */
  this['root'] = null;

  /**
   * @type {?string}
   */
  this['title'] = this.entry.getTitle();

  /**
   * @type {?string}
   */
  this['description'] = this.entry.getDescription();

  this.create_();

  $scope.$on('$destroy', goog.bind(this.onDestroy_, this));
};


/**
 * Cleanup
 * @private
 */
os.ui.filter.ui.ViewFiltersCtrl.prototype.onDestroy_ = function() {
  os.ui.filter.ui.ViewFiltersCtrl.closeRemoveMultipleWindow_();
  this.scope = null;
  this.element = null;
};


/**
 * Creates the expressions from the filter
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.ui.filter.ui.ViewFiltersCtrl.prototype.create_ = function(opt_event) {
  this['root'] = new os.ui.filter.ui.GroupNode(true);
  var node = this.entry.getFilterNode();

  if (node) {
    this['root'].setGrouping(node.localName);
    this.readFilters_(node, this['root']);
  }
};


/**
 * Traverses the filter XML and adds nodes to the slicktree.
 * @param {Node} ele
 * @param {os.structs.ITreeNode} treeNode
 * @private
 */
os.ui.filter.ui.ViewFiltersCtrl.prototype.readFilters_ = function(ele, treeNode) {
  var child = goog.dom.getFirstElementChild(ele);
  var next = null;

  while (child) {
    var childTreeNode = this.addTreeNode_(child, treeNode);
    next = goog.dom.getNextElementSibling(child);
    if (childTreeNode instanceof os.ui.filter.ui.GroupNode) {
      this.readFilters_(child, childTreeNode);
    }
    child = next;
  }
};


/**
 * Creates a tree node for the child and adds it as a child to the treeNode passed in.
 * @param {Node} child
 * @param {os.structs.ITreeNode} treeNode
 * @return {os.structs.ITreeNode}
 * @private
 */
os.ui.filter.ui.ViewFiltersCtrl.prototype.addTreeNode_ = function(child, treeNode) {
  var isExpr = false;
  for (var i = 0; i < os.ui.filter.OPERATIONS.length; i++) {
    if (os.ui.filter.OPERATIONS[i].matches(angular.element(child))) {
      isExpr = true;
      break;
    }
  }

  if (!isExpr) {
    // add a grouping node
    var groupNode = new os.ui.filter.ui.GroupNode(true);
    groupNode.setGrouping(child.localName);
    treeNode.addChild(groupNode);
    return groupNode;
  } else {
    // add an expression node
    var exprNode = os.ui.filter.ui.ExpressionNode.createExpressionNode(child, this.scope['columns'], true);
    treeNode.addChild(exprNode);
    treeNode.collapsed = false;
    return exprNode;
  }
};


/**
 * Cancels the filter
 */
os.ui.filter.ui.ViewFiltersCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.filter.ui.ViewFiltersCtrl.prototype,
    'cancel',
    os.ui.filter.ui.ViewFiltersCtrl.prototype.cancel);


/**
 * Closes the expression view window.
 * @private
 */
os.ui.filter.ui.ViewFiltersCtrl.closeRemoveMultipleWindow_ = function() {
  var childWindow = angular.element('#removeMultiple');
  if (childWindow) {
    os.ui.window.close(childWindow);
  }
};
