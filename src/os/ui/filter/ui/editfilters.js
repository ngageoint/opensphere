goog.module('os.ui.filter.ui.EditFiltersUI');

goog.require('os.ui.filter.AdvancedFilterBuilderUI');
goog.require('os.ui.filter.BasicFilterBuilderUI');
goog.require('os.ui.util.ValidationMessageUI');

const {getFirstElementChild, getNextElementSibling} = goog.require('goog.dom');
const {ROOT} = goog.require('os');
const DataManager = goog.require('os.data.DataManager');
const Metrics = goog.require('os.metrics.Metrics');
const {Filters} = goog.require('os.metrics.keys');
const Module = goog.require('os.ui.Module');
const {OPERATIONS} = goog.require('os.ui.filter');
const ExpressionNode = goog.require('os.ui.filter.ui.ExpressionNode');
const GroupNode = goog.require('os.ui.filter.ui.GroupNode');
const {exists, close} = goog.require('os.ui.window');
const ConfirmUI = goog.require('os.ui.window.ConfirmUI');

const SlickTreeNode = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The filter window directive
 *
 * @return {angular.Directive}
 */
const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/filter/editfilters.html',
  controller: Controller,
  controllerAs: 'filters'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
const directiveTag = 'editfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the filters window.
 * @unrestricted
 */
class Controller {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope The Angular scope.
   * @param {!angular.JQLite} $element The root DOM element.
   * @ngInject
   */
  constructor($scope, $element) {
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
     * @type {?GroupNode}
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
     * @type {string}
     */
    this['tags'] = this.entry.getTags();

    /**
     * @type {boolean}
     */
    this['isComplex'] = false;

    /**
     * @type {string}
     */
    this['isDefault'] = this.entry.isDefault();

    this.create_();
    this.checkFilter_();

    /**
     * @type {string}
     */
    $scope['tab'] = this['isComplex'] ? 'advanced' : 'basic';

    $scope.$on('filterbuilder.remove', this.onRemove_.bind(this));
    $scope.$on('$destroy', this.onDestroy.bind(this));
    if (this.entry.getFilter()) {
      Metrics.getInstance().updateMetric(Filters.EDIT, 1);
    } else {
      Metrics.getInstance().updateMetric(Filters.NEW, 1);
    }
  }

  /**
   * Cleanup
   *
   * @protected
   */
  onDestroy() {
    closeRemoveMultipleWindow();
    this.scope = null;
    this.element = null;
  }

  /**
   * Checks whether the filter is basic.
   *
   * @private
   */
  checkFilter_() {
    var root = this['root'];
    this['isComplex'] = false;

    if (root && root.getChildren()) {
      var children = root.getChildren();
      if (root.getGrouping() == 'Not') {
        this['isComplex'] = true;
        return;
      }

      for (var i = 0; i < children.length; i++) {
        if (children[i] instanceof GroupNode) {
          this['isComplex'] = true;
          break;
        }
      }
    }
  }

  /**
   * Creates the expressions from the filter
   *
   * @param {goog.events.Event=} opt_event
   * @private
   */
  create_(opt_event) {
    this['root'] = new GroupNode();
    var node = this.entry.getFilterNode();

    if (node) {
      this['root'].setGrouping(node.localName);
      this.readFilters_(node, this['root']);
    }
  }

  /**
   * Traverses the filter XML and adds nodes to the slicktree.
   *
   * @param {Node} ele
   * @param {SlickTreeNode} treeNode
   * @private
   */
  readFilters_(ele, treeNode) {
    var child = getFirstElementChild(ele);
    var next = null;

    while (child) {
      var childTreeNode = this.addTreeNode_(child, treeNode);
      next = getNextElementSibling(child);
      if (childTreeNode instanceof GroupNode) {
        this.readFilters_(child, childTreeNode);
      }
      child = next;
    }
  }

  /**
   * Creates a tree node for the child and adds it as a child to the treeNode passed in.
   *
   * @param {Node} child
   * @param {SlickTreeNode} treeNode
   * @return {SlickTreeNode}
   * @private
   */
  addTreeNode_(child, treeNode) {
    var isExpr = false;
    for (var i = 0; i < OPERATIONS.length; i++) {
      if (OPERATIONS[i].matches(angular.element(child))) {
        isExpr = true;
        break;
      }
    }

    if (!isExpr) {
      // add a grouping node
      var groupNode = new GroupNode();
      groupNode.setGrouping(child.localName);
      treeNode.addChild(groupNode);
      return groupNode;
    } else {
      // add an expression node
      var exprNode = ExpressionNode.createExpressionNode(child, this.scope['columns']);
      treeNode.addChild(exprNode);
      treeNode.collapsed = false;
      return exprNode;
    }
  }

  /**
   * Handles node remove events
   *
   * @param {angular.Scope.Event} event
   * @param {os.structs.ITreeNode} node The node to remove
   * @private
   */
  onRemove_(event, node) {
    if (!node.getChildren()) {
      this.doRemove_(node);
    } else {
      if (exists('removeMultiple')) {
        // don't open multiple of this window
        return;
      }

      ConfirmUI.launchConfirm(/** @type {osx.window.ConfirmOptions} */ ({
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
          'width': 300,
          'height': 'auto',
          'icon': 'fa fa-warning',
          'modal': 'true',
          'headerClass': 'bg-danger u-bg-danger-text'
        }
      }));
    }
  }

  /**
   * Removes a node.
   *
   * @param {os.structs.ITreeNode} node The node to remove
   * @private
   */
  doRemove_(node) {
    var parent = node.getParent();
    parent.removeChild(node);
  }

  /**
   * Sets the tab value and broadcasts an event to the children.
   *
   * @param {string} tab
   * @export
   */
  setTab(tab) {
    this.checkFilter_();
    this.scope['tab'] = tab;
    this.scope.$broadcast('tabChange', tab);
  }

  /**
   * Gets whether the form is invalid
   *
   * @return {boolean}
   * @export
   */
  isInvalid() {
    return this.scope['tab'] === 'basic' && this['isComplex'] ||
        this.isNodeInvalid(/** @type {!GroupNode} */ (this['root']));
  }

  /**
   * @param {!(GroupNode|ExpressionNode)} node
   * @return {boolean}
   * @protected
   */
  isNodeInvalid(node) {
    if (node instanceof GroupNode) {
      var children = node.getChildren();

      if (children && children.length) {
        for (var i = 0, n = children.length; i < n; i++) {
          if (this.isNodeInvalid(
              /** @type {!(GroupNode|ExpressionNode)}  */ (children[i]))) {
            return true;
          }
        }

        return false;
      }

      return true;
    } else if (node instanceof ExpressionNode) {
      var expr = /** @type {ExpressionNode} */ (node).getExpression();
      return !expr.validate(expr['literal']);
    }

    return true;
  }

  /**
   * Cancels the filter
   *
   * @export
   */
  cancel() {
    close(this.element);
  }

  /**
   * User clicked OK
   *
   * @export
   */
  finish() {
    this.entry.setTitle(this['title']);
    this.entry.setDescription(this['description']);
    this.entry.setTags(this['tags']);

    var filter = this['root'].writeFilter(this['title'], this['description']);
    this.entry.setFilter(filter);

    var dm = DataManager.getInstance();
    if (dm) {
      if (dm.getDescriptor(this.entry.getType()) == null) {
        this.entry.setTemporary(true);
      }
    }

    // tell the thing that launched us that we're done
    if (this.scope['callback']) {
      this.scope['callback'](this.entry);
    }

    close(this.element);
  }
}

/**
 * Closes the expression edit window.
 */
const closeRemoveMultipleWindow = () => {
  var childWindow = angular.element('#removeMultiple');
  if (childWindow) {
    close(childWindow);
  }
};

exports = {
  Controller,
  directive,
  directiveTag
};
