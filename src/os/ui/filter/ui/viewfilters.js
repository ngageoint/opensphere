goog.declareModuleId('os.ui.filter.ui.ViewFiltersUI');

import '../advancedfilterbuilder.js';
import {ROOT} from '../../../os.js';
import Module from '../../module.js';
import {close} from '../../window.js';
import {OPERATIONS} from '../filter.js';
import ExpressionNode from './expressionnode.js';
import GroupNode from './groupnode.js';

const {getFirstElementChild, getNextElementSibling} = goog.require('goog.dom');

const {default: FilterEntry} = goog.requireType('os.filter.FilterEntry');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * The filter window directive
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  scope: true,
  templateUrl: ROOT + 'views/filter/viewfilters.html',
  controller: Controller,
  controllerAs: 'filters'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'viewfilter';

/**
 * Add the directive to the module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for the filters window.
 * @unrestricted
 */
export class Controller {
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
     * @type {FilterEntry}
     * @protected
     */
    this.entry = /** @type {FilterEntry} */ ($scope['entry']);

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

    this.create_();

    $scope.$on('$destroy', this.onDestroy_.bind(this));
  }

  /**
   * Cleanup
   *
   * @private
   */
  onDestroy_() {
    closeRemoveMultipleWindow();
    this.scope = null;
    this.element = null;
  }

  /**
   * Creates the expressions from the filter
   *
   * @param {goog.events.Event=} opt_event
   * @private
   */
  create_(opt_event) {
    this['root'] = new GroupNode(true);
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
      var groupNode = new GroupNode(true);
      groupNode.setGrouping(child.localName);
      treeNode.addChild(groupNode);
      return groupNode;
    } else {
      // add an expression node
      var exprNode = ExpressionNode.createExpressionNode(child, this.scope['columns'], true);
      treeNode.addChild(exprNode);
      treeNode.collapsed = false;
      return exprNode;
    }
  }

  /**
   * Cancels the filter
   *
   * @export
   */
  cancel() {
    close(this.element);
  }
}

/**
 * Closes the expression view window.
 */
const closeRemoveMultipleWindow = () => {
  var childWindow = angular.element('#removeMultiple');
  if (childWindow) {
    close(childWindow);
  }
};
