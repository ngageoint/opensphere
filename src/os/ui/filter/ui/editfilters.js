goog.provide('os.ui.filter.ui.EditFiltersCtrl');
goog.provide('os.ui.filter.ui.editFiltersDirective');
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
os.ui.filter.ui.editFiltersDirective = function() {
  return {
    restrict: 'AE',
    replace: true,
    scope: true,
    templateUrl: os.ROOT + 'views/filter/editfilters.html',
    controller: os.ui.filter.ui.EditFiltersCtrl,
    controllerAs: 'filters'
  };
};


/**
 * Add the directive to the module
 */
os.ui.Module.directive('editfilter', [os.ui.filter.ui.editFiltersDirective]);



/**
 * Controller for the filters window.
 * @param {!angular.Scope} $scope The Angular scope.
 * @param {!angular.JQLite} $element The root DOM element.
 * @constructor
 * @ngInject
 */
os.ui.filter.ui.EditFiltersCtrl = function($scope, $element) {
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

  /**
   * @type {boolean}
   */
  this['isComplex'] = false;

  this.create_();
  this.checkFilter_();

  /**
   * @type {string}
   */
  $scope['tab'] = this['isComplex'] ? 'advanced' : 'basic';

  $scope.$on('filterbuilder.remove', goog.bind(this.onRemove_, this));
  $scope.$on('$destroy', goog.bind(this.onDestroy, this));
  if (this.entry.getFilter()) {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.EDIT, 1);
  } else {
    os.metrics.Metrics.getInstance().updateMetric(os.metrics.keys.Filters.NEW, 1);
  }
};


/**
 * Cleanup
 * @protected
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.onDestroy = function() {
  os.ui.filter.ui.EditFiltersCtrl.closeRemoveMultipleWindow_();
  this.scope = null;
  this.element = null;
};


/**
 * Checks whether the filter is basic.
 * @private
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.checkFilter_ = function() {
  var root = this['root'];
  this['isComplex'] = false;

  if (root && root.getChildren()) {
    var children = root.getChildren();
    if (root.getGrouping() == 'Not') {
      this['isComplex'] = true;
      return;
    }

    for (var i = 0; i < children.length; i++) {
      if (children[i] instanceof os.ui.filter.ui.GroupNode) {
        this['isComplex'] = true;
        break;
      }
    }
  }
};


/**
 * Creates the expressions from the filter
 * @param {goog.events.Event=} opt_event
 * @private
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.create_ = function(opt_event) {
  this['root'] = new os.ui.filter.ui.GroupNode();
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
os.ui.filter.ui.EditFiltersCtrl.prototype.readFilters_ = function(ele, treeNode) {
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
os.ui.filter.ui.EditFiltersCtrl.prototype.addTreeNode_ = function(child, treeNode) {
  var isExpr = false;
  for (var i = 0; i < os.ui.filter.OPERATIONS.length; i++) {
    if (os.ui.filter.OPERATIONS[i].matches(angular.element(child))) {
      isExpr = true;
      break;
    }
  }

  if (!isExpr) {
    // add a grouping node
    var groupNode = new os.ui.filter.ui.GroupNode();
    groupNode.setGrouping(child.localName);
    treeNode.addChild(groupNode);
    return groupNode;
  } else {
    // add an expression node
    var exprNode = os.ui.filter.ui.ExpressionNode.createExpressionNode(child, this.scope['columns']);
    treeNode.addChild(exprNode);
    treeNode.collapsed = false;
    return exprNode;
  }
};


/**
 * Handles node remove events
 * @param {angular.Scope.Event} event
 * @param {os.structs.ITreeNode} node The node to remove
 * @private
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.onRemove_ = function(event, node) {
  if (!node.getChildren()) {
    this.doRemove_(node);
  } else {
    if (os.ui.window.exists('removeMultiple')) {
      // don't open multiple of this window
      return;
    }

    os.ui.window.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
      confirm: this.doRemove_.bind(this, node),
      prompt: 'Are you sure you want to remove multiple items from the filter?',
      yesText: 'Yes',
      yesButtonIcon: 'fa-trash',
      yesButtonClass: 'btn-danger',
      noText: 'No',
      noIcon: 'fa fa-remove',
      windowOptions: {
        'id': 'removeMultiple',
        'x': 'center',
        'y': 'center',
        'label': 'Remove Items',
        'show-close': false,
        'no-scroll': true,
        'width': 300,
        'height': 'auto',
        'icon': 'fa fa-warning',
        'modal': 'true',
        'headerClass': 'bg-danger u-bg-danger-text'
      }
    }));
  }
};


/**
 * Removes a node.
 * @param {os.structs.ITreeNode} node The node to remove
 * @private
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.doRemove_ = function(node) {
  var parent = node.getParent();
  parent.removeChild(node);
};


/**
 * Sets the tab value and broadcasts an event to the children.
 * @param {string} tab
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.setTab = function(tab) {
  this.checkFilter_();
  this.scope['tab'] = tab;
  this.scope.$broadcast('tabChange', tab);
};
goog.exportProperty(
    os.ui.filter.ui.EditFiltersCtrl.prototype,
    'setTab',
    os.ui.filter.ui.EditFiltersCtrl.prototype.setTab);


/**
 * Gets whether the form is invalid
 * @return {boolean}
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.isInvalid = function() {
  return this.scope['tab'] === 'basic' && this['isComplex'] ||
      this.isNodeInvalid(/** @type {!os.ui.filter.ui.GroupNode} */ (this['root']));
};
goog.exportProperty(
    os.ui.filter.ui.EditFiltersCtrl.prototype,
    'isInvalid',
    os.ui.filter.ui.EditFiltersCtrl.prototype.isInvalid);


/**
 * @param {!(os.ui.filter.ui.GroupNode|os.ui.filter.ui.ExpressionNode)} node
 * @return {boolean}
 * @protected
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.isNodeInvalid = function(node) {
  if (node instanceof os.ui.filter.ui.GroupNode) {
    var children = node.getChildren();

    if (children && children.length) {
      for (var i = 0, n = children.length; i < n; i++) {
        if (this.isNodeInvalid(
            /** @type {!(os.ui.filter.ui.GroupNode|os.ui.filter.ui.ExpressionNode)}  */ (children[i]))) {
          return true;
        }
      }

      return false;
    }

    return true;
  } else if (node instanceof os.ui.filter.ui.ExpressionNode) {
    var expr = /** @type {os.ui.filter.ui.ExpressionNode} */ (node).getExpression();
    return !expr.validate(expr['literal']);
  }

  return true;
};


/**
 * Cancels the filter
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.cancel = function() {
  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.filter.ui.EditFiltersCtrl.prototype,
    'cancel',
    os.ui.filter.ui.EditFiltersCtrl.prototype.cancel);


/**
 * User clicked OK
 */
os.ui.filter.ui.EditFiltersCtrl.prototype.finish = function() {
  this.entry.setTitle(this['title']);
  this.entry.setDescription(this['description']);

  var filter = this['root'].writeFilter(this['title'], this['description']);
  this.entry.setFilter(filter);

  // tell the thing that launched us that we're done
  if (this.scope['callback']) {
    this.scope['callback'](this.entry);
  }

  os.ui.window.close(this.element);
};
goog.exportProperty(
    os.ui.filter.ui.EditFiltersCtrl.prototype,
    'finish',
    os.ui.filter.ui.EditFiltersCtrl.prototype.finish);


/**
 * Closes the expression edit window.
 * @private
 */
os.ui.filter.ui.EditFiltersCtrl.closeRemoveMultipleWindow_ = function() {
  var childWindow = angular.element('#removeMultiple');
  if (childWindow) {
    os.ui.window.close(childWindow);
  }
};
