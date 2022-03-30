goog.declareModuleId('os.ui.slick.SlickTreeUI');

import {remove} from 'ol/src/array.js';

import Module from '../module.js';
import {apply} from '../ui.js';
import {Controller as SlickGridCtrl} from './slickgrid.js';
import SlickTreeNode from './slicktreenode.js';

const Delay = goog.require('goog.async.Delay');
const {getAncestor} = goog.require('goog.dom');
const {contains} = goog.require('goog.dom.classlist');
const GoogEventType = goog.require('goog.events.EventType');

const GoogEvent = goog.requireType('goog.events.Event');
const {default: PropertyChangeEvent} = goog.requireType('os.events.PropertyChangeEvent');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * The slick tree directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => ({
  restrict: 'AE',
  replace: true,
  template: '<div class="c-slick-tree"></div>',
  scope: {
    /**
     * The data for the tree
     */
    'data': '=',

    /**
     * The selected item(s)
     */
    'selected': '=',

    /**
     * The context menu
     */
    'contextMenu': '&',

    /**
     * The class to use for the checkbox
     */
    'checkboxClass': '@',

    /**
     * The tool tip to use for the checkbox
     */
    'checkboxTooltip': '@',

    /**
     * Whether or not to disable folders
     */
    'disableFolders': '@',

    /**
     * Whether or not to disable selection
     */
    'disableSelection': '@',

    /**
     * Whether or not to enable drag/drop
     */
    'dragEnabled': '=?',

    /**
     * Whether or not to enable multiselect
     */
    'multiSelect': '@',

    /**
     * A CSS selector to which to attach a resize listener
     */
    'resizeWith': '@',

    /**
     * CSS class to use for spinners
     */
    'spinClass': '@',

    /**
     * Whether or not to show the root of the tree
     */
    'showRoot': '@',
    'disposable': '@',

    /**
     * Overrides the default double click handler
     * @see {@link os.ui.slick.SlickGridUI}
     */
    'dblClickHandler': '=?',

    /**
     * CSS class to use for window launcher box
     */
    'winLauncherClass': '@',

    /**
     * Options Override
     */
    'options': '=?',

    /**
     * Whether or not there is a root node. This fixes the case where you dont want to show the root
     * And you also want slicktree to create the root
     */
    'noRoot': '@'
  },
  controller: Controller,
  controllerAs: 'tree'
});

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'slicktree';

/**
 * Add the directive to the os.ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for SlickGrid Tree
 * @unrestricted
 */
export class Controller extends SlickGridCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    // tree double click will expand/collapse nodes
    $scope['dblClickEnabled'] = true;

    // multi select should default to being disabled, so only enabled when set to the string 'true'
    $scope['multiSelect'] = $scope['multiSelect'] == 'true';

    super($scope, $element, $compile);

    /**
     * The tree's checkbox class
     * @type {string}
     * @private
     */
    this.checkboxClass_ = $scope['checkboxClass'] || 'c-tristate';

    /**
     * The tree's spinner class
     * @type {string}
     * @private
     */
    this.spinClass_ = $scope['spinClass'] || 'fa-spin fa-spinner';

    /**
     * The tree's checkbox class
     * @type {string}
     * @private
     */
    this.winLauncherClass_ = $scope['winLauncherClass'] || 'fa fa-fw fa-plus';

    /**
     * @type {?Array}
     * @private
     */
    this.treeData_ = [];

    // create the data view
    this.dataView.setFilter(this.treeFilter_.bind(this));

    // booleans using @ will be true if they're set to anything other than undefined/null
    $scope['disableFolders'] = $scope['disableFolders'] != null;
    $scope['showRoot'] = $scope['showRoot'] != null;
    $scope['noRoot'] = $scope['noRoot'] != null;
    if ($scope['noRoot']) {
      $scope['showRoot'] = false;
    }
    $scope['disposable'] = $scope['disposable'] != null;

    this.grid.onRowRender.subscribe(this.onRowRender.bind(this));
    this.grid.onRowRenderComplete.subscribe(this.onRowRenderComplete.bind(this));
    this.grid.onRowRemove.subscribe(this.onRowRemove.bind(this));
    this.grid.onActiveCellChanged.subscribe(this.apply.bind(this));

    /**
     * @type {?ITreeNode}
     * @private
     */
    this.root_ = null;

    /**
     * @type {Delay}
     * @private
     */
    this.rootChangeDelay_ = new Delay(this.flattenRoot_, 10, this);

    /**
     * the move mode used for drag and drop
     * @type {!SlickTreeNode.MOVE_MODE}
     * @protected
     */
    this.moveMode = SlickTreeNode.MOVE_MODE.SIBLING;
  }

  /**
   * @inheritDoc
   */
  disposeInternal() {
    this.disposeRoot_();

    this.compile = null;
    this.treeData_ = null;
    if (this.rootChangeDelay_) {
      this.rootChangeDelay_.dispose();
      super.disposeInternal();
    }

    this.rootChangeDelay_ = null;
  }

  /**
   * Cleans up the root node, removing listeners and disposing it if this tree instance created the node.
   *
   * @private
   */
  disposeRoot_() {
    if (this.root_) {
      this.root_.unlisten(GoogEventType.PROPERTYCHANGE, this.onRootChange_, false, this);


      // we created the root node, so remove its children and dispose of it
      if (this.destroyRoot_) {
        if (!this.scope['disposable']) {
          // if disposable is false, we set the children of the root to null before disposing it
          this.root_.setChildren(null);
        }
        this.root_.dispose();
      }

      this.root_ = null;
    }

    this.destroyRoot_ = false;
  }

  /**
   * @inheritDoc
   */
  getOptions() {
    var selectable = this.scope['disableSelection'] != 'true';
    var defaults = {
      // prevent the slick index behavior when selection is disabled, not very useful in our trees - THIN-6977
      'enableCellNavigation': selectable,
      'fullWidthRows': true,
      'forceFitColumns': true,
      'multiSelect': this.isMultiSelect(),
      'useRowRenderEvents': true,
      'headerRowHeight': 0,
      'rowHeight': 21
    };
    if (this.scope['options']) {
      return Object.assign(defaults, this.scope['options']);
    }
    return defaults;
  }

  /**
   * @inheritDoc
   */
  getColumns() {
    return [{
      'id': 'label',
      'name': 'Label',
      'field': 'label',
      'sortable': false,
      'formatter': this.treeFormatter.bind(this)
    }];
  }

  /**
   * Get the context menu action args for layer tree.
   *
   * @param {GoogEvent=} opt_event
   * @return {*}
   * @override
   * @protected
   */
  getContextArgs(opt_event) {
    var targetNode;

    if (opt_event) {
      try {
        var target = getAncestor(/** @type {Node} */ (opt_event.target), this.isTreeNode_.bind(this));
        if (target) {
          var scope = /** @type {angular.Scope} */ (angular.element(target).scope());
          targetNode = /** @type {SlickTreeNode} */ (scope['item']);
        }
      } catch (e) {
      }
    }

    if (targetNode) {
      if (!this.scope['selected'] || (!this.isMultiSelect() && this.scope['selected'] != targetNode) ||
          (Array.isArray(this.scope['selected']) && !this.scope['selected'].includes(targetNode))) {
        this.scope['selected'] = [targetNode];
      }
    }

    return this.scope['selected'];
  }

  /**
   * If multi select is enabled on the grid.
   * @return {boolean}
   * @protected
   */
  isMultiSelect() {
    // Enable multi select if set to the boolean true or string literal "true".
    return this.scope != null && (this.scope['multiSelect'] === true || this.scope['multiSelect'] === 'true');
  }

  /**
   * Tests if a DOM node contains a scope with a tree node.
   *
   * @param {Node} node
   * @return {boolean}
   * @private
   */
  isTreeNode_(node) {
    var element = /** @type {Element} */ (node);
    if (contains(element, 'ng-scope')) {
      var scope = angular.element(element).scope();
      return scope != null && 'item' in scope && scope['item'] instanceof SlickTreeNode;
    }

    return false;
  }

  /**
   * @inheritDoc
   */
  onDataChange(newVal, oldVal) {
    if (newVal) {
      this.changeData_(newVal);
    }
  }

  /**
   * Changes the data on the tree
   *
   * @param {*} newVal The new value
   * @private
   */
  changeData_(newVal) {
    // if the root node is changing, clean up the existing root node
    if (newVal !== this.root_) {
      this.disposeRoot_();
    }

    if (!Array.isArray(newVal)) {
      newVal = [newVal];
    }

    if (!this.scope['noRoot'] && newVal.length == 1) {
      if (this.root_ !== newVal[0]) {
        this.root_ = newVal[0];
      }

      if (!this.scope['showRoot'] && this.root_.getChildren() && this.root_.getChildren().length > 0) {
        newVal = this.root_.getChildren();
      }
    } else {
      this.root_ = new SlickTreeNode();

      // make sure we clean up this root node since we created it
      this.destroyRoot_ = true;

      // prune root nodes without children
      //    var i = newVal.length;
      //    while (i--) {
      //      var node = /** @type {TreeNode} */ (newVal[i]);
      //      if ((node.getChildren() || []).length == 0) {
      //        newVal.splice(i, 1);
      //      }
      //    }

      this.root_.setChildren(newVal, true);
    }

    // ignore events if we want slickgrid to own the root
    if (!this.scope['noRoot'] && this.root_) {
      this.root_.listen(GoogEventType.PROPERTYCHANGE, this.onRootChange_, false, this);
    }

    this.treeData_.length = 0;
    Controller.flatten_(newVal, this.treeData_);
    this.updateData(this.treeData_);

    // trigger a row re-render in case child changes affect existing row display (like icons)
    this.invalidateRows();
  }

  /**
   * Handles changes on the root node
   *
   * @param {PropertyChangeEvent} e The event
   * @private
   */
  onRootChange_(e) {
    var p = e.getProperty();
    if (p == 'children' || p == 'label' && this.root_) {
      this.rootChangeDelay_.start();
    }

    if (p == 'scrollRowIntoView') {
      var id = e.getNewValue();
      if (id) {
        var row = this.dataView.getRowById(id);
        this.grid.scrollRowIntoView(row, 0);
      }
    }
  }

  /**
   * This is the handler for rootChangeDelay. After the tree children
   * have finished changing, this will fire to flatten the tree
   *
   * @private
   */
  flattenRoot_() {
    this.changeData_(this.root_);
  }

  /**
   * @inheritDoc
   */
  onItemClick(e, args) {
    var item = /** @type {SlickTreeNode} */ (this.dataView.getItem(args['row']));
    if (item && contains(/** @type {!Element} */ (e.target), 'js-node-toggle')) {
      item.setCollapsed(!item.collapsed);
      this.dataView.updateItem(item['id'], item);
      this.scope.$emit('collapseChange');
    }

    super.onItemClick(e, args);
  }

  /**
   * @inheritDoc
   */
  onDblClick(e, args) {
    var item = /** @type {SlickTreeNode} */ (this.dataView.getItem(args['row']));

    if (item) {
      var children = item.getChildren();
      if (children && children.length > 0) {
        item.setCollapsed(!item.collapsed);
        this.dataView.updateItem(item['id'], item);
        this.scope.$emit('collapseChange');
      }
    }
  }

  /**
   * @inheritDoc
   */
  onMouseEnter(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;

      var cell = this.grid.getCellFromEvent(e);
      var row = /** @type {number} */ (cell['row']);
      var cellNode = this.grid.getCellNode(row, 0);
      if (cellNode) {
        $(cellNode).addClass('hovered');
      }

      var treeNode = /** @type {SlickTreeNode} */ (this.grid.getDataItem(row));
      if (treeNode) {
        try {
          treeNode.onMouseEnter();
        } catch (e) {
        }
      }

      this.apply();

      this.inEvent = false;
    }
  }

  /**
   * @inheritDoc
   */
  onMouseLeave(e, args) {
    if (!this.inEvent) {
      this.inEvent = true;
      this.element.find('.hovered').removeClass('hovered');

      var cell = this.grid.getCellFromEvent(e);
      var row = /** @type {number} */ (cell['row']);

      var treeNode = /** @type {SlickTreeNode} */ (this.grid.getDataItem(row));
      if (treeNode) {
        try {
          treeNode.onMouseLeave();
        } catch (e) {
        }
      }

      this.apply();
      this.inEvent = false;
    }
  }

  /**
   * The filter for the slickgrid tree
   *
   * @param {SlickTreeNode} item The item
   * @return {boolean}
   * @private
   */
  treeFilter_(item) {
    item = item.parentIndex > -1 ? this.treeData_[item.parentIndex] : null;

    while (item) {
      if (item.collapsed) {
        return false;
      }

      item = item.parentIndex > -1 ? this.treeData_[item.parentIndex] : null;
    }

    return true;
  }

  /**
   * Formats a tree row
   *
   * @param {number} row The row number
   * @param {number} cell The cell number in the row
   * @param {string} value The value
   * @param {Object} columnDef The column definition
   * @param {SlickTreeNode} node The node
   * @protected
   * @return {string} The HTML for the row
   */
  treeFormatter(row, cell, value, columnDef, node) {
    if (value == null) {
      value = '';
    }

    return node.format(row, cell, value);
  }

  /**
   * Compiles any angular directives in the cell HTML
   *
   * @param {*} e The event
   * @param {{row: number, node: Element, item: Object}} args The event data
   * @protected
   * @override
   */
  onRowRender(e, args) {
    // make a new scope
    var s = this.scope.$new();
    this.initRowScope(s, args['row'], args['node'], args['item']);

    // compile
    this.compile(args['node'])(s);
  }

  /**
   * After all the rows are rendered, run an apply
   *
   * @param {*} e The event
   * @param {{row: number, node: Element, item: Object}} args The event data
   * @protected
   */
  onRowRenderComplete(e, args) {
    apply(this.scope);
  }

  /**
   * @param {angular.Scope} s
   * @param {number} row
   * @param {Element} node
   * @param {Object} item
   * @protected
   */
  initRowScope(s, row, node, item) {
    // put the data item on the scope
    s['item'] = item;

    var slickNode = /** @type {SlickTreeNode} */ (s['item']);

    // put the checkbox class on the scope
    s['chkClass'] = slickNode.checkboxClass || this.checkboxClass_;

    // put the spinner class on the scope
    s['spinClass'] = this.spinClass_;

    s['disableFolders'] = slickNode.getDisableFolder() || this.scope['disableFolders'];

    s['chkTooltip'] = slickNode.checkboxTooltip || this.scope['checkboxTooltip'];

    s['itemAction'] = this.onItemAction_.bind(this, item);

    s['winLauncherClass'] = slickNode.winLauncherClass || this.winLauncherClass_;
  }

  /**
   * Performs an action on a tree item.
   *
   * @param {*} item The tree item
   * @param {string} type The action type
   * @private
   */
  onItemAction_(item, type) {
    if (item instanceof SlickTreeNode) {
      item.performAction(type);
    }
  }

  /**
   * @inheritDoc
   */
  getData() {
    var data = this.scope['data'] || [];
    if (!Array.isArray(data)) {
      data = [data];
    }
    return data;
  }

  /**
   * Fix the sibling order.
   *
   * @param {Array} data
   * @param {SlickTreeNode} parent
   * @param {Array} rows
   * @param {number} insertBefore - the new parent to insert the rows under
   * @return {Array} the new ordered children
   * @private
   */
  updateSiblings_(data, parent, rows, insertBefore) {
    // Find where to put the childen in the parents array
    var children = parent.getChildren();
    var insertBeforeChild = children.findIndex(function(child) {
      return child == data[insertBefore];
    });

    if (insertBeforeChild == -1) {
      // -1 indicates a drop on a folder, so put the new child at the front of the children array so it appears first
      insertBeforeChild = 0;
    }

    var left = children.slice(0, insertBeforeChild);
    var right = children.slice(insertBeforeChild, children.length);

    var extractedRows = [];
    for (var i = 0, n = rows.length; i < n; i++) {
      var item = data[rows[i]];
      // If this is a true child (not a child's child) save it
      if (parent.hasChild(item)) {
        extractedRows.push(item);
      }
    }

    extractedRows.forEach(function(row) {
      remove(left, row);
      remove(right, row);
    });

    children = left.concat(extractedRows.concat(right));

    return children;
  }

  /**
   * Fix the parent and child links. Remove things not moved together.
   *
   * @param {Array} data
   * @param {Array} rows
   * @param {SlickTreeNode|number} insertBefore - the new parent to insert the rows under
   * @private
   */
  updateHierarchy_(data, rows, insertBefore) {
    var newParent = null;
    if (insertBefore instanceof SlickTreeNode) {
      newParent = insertBefore;
    } else if (typeof insertBefore == 'number') {
      if (this.scope['showRoot'] && this.moveMode == SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT) {
        newParent = this.root_;
      } else if (this.moveMode != SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT) {
        newParent = data[insertBefore] || this.root_;
      }
    }

    var firstRow = /** @type {SlickTreeNode} */ (data[rows[0]]);
    var reparentList = [];

    // Just verify that any parents exist in the rows that are moving. If not remove their links
    rows.forEach(function(rowid) {
      var row = data[rowid];

      // Only reparent top level nodes for now.
      if (firstRow.getDepth() == row.getDepth()) {
        reparentList.push(row);
      }

      // If this row has a parent, check if exists in the moving list. If not cut it!
      var parentRow = row.getParent();
      if (parentRow) {
        var found = rows.find(function(rowid) {
          return parentRow === data[rowid];
        });
        if (!found) {
          parentRow.removeChild(row);
        }
      }
    });

    // Set all the top level rows new parent
    reparentList.forEach(function(row) {
      row.setParent(newParent);
    });
  }

  /**
   * @inheritDoc
   */
  canDragMove(rows, insertBefore) {
    if (isNaN(insertBefore) ||
        (this.scope['showRoot'] && insertBefore == 0) ||
        (!this.scope['showRoot'] && insertBefore > this.dataView.getItems().length - 1)) {
      return false;
    }

    var movedRow = /** @type {SlickTreeNode} */ (this.dataView.getItem(rows[0]));
    var targetNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(insertBefore));
    if (!movedRow || movedRow == this.root_) {
      // Dont allow moving if its moving before the sibling right after it
      return false;
    } else if (!targetNode) {
      return true;
    }

    var depth = movedRow.getDepth();
    for (var i = 0, n = rows.length; i < n; i++) {
      if (this.dataView.getItem(rows[i]).getDepth() < depth || rows[i] == insertBefore) {
        // Dont allow moving depths higher than the first row. Only siblings and children
        // Dont allow moving to itself
        return false;
      }
    }

    if (targetNode.hasElder(movedRow) ||
        (targetNode == movedRow.getParent() && this.moveMode != SlickTreeNode.MOVE_MODE.SIBLING) ||
        (!this.scope['showRoot'] && targetNode == this.root_)) {
      // parent is getting dragged to a child
      // child is getting dragged to the same parent
      // node isnt allowed to be a sibling of the root
      return false;
    } else if (movedRow.getParentIndex() == targetNode.getParentIndex() &&
        this.moveMode != SlickTreeNode.MOVE_MODE.REPARENT) {
      // Expensive, but needed? Dont allowing moving to the same spot if the list is expanded
      // and you move before your next sibling
      var parent = movedRow.getParent();
      if (!parent) {
        parent = this.root_;
      }
      var children = parent.getChildren();
      var index = children.findIndex(function(child) {
        return child == movedRow;
      });
      if (index < children.length - 1 && children[index + 1] == targetNode) {
        return false;
      }
    }
    if (this.moveMode == SlickTreeNode.MOVE_MODE.SIBLING) {
      return true;
    } else {
      return targetNode.isChildAllowed();
    }
  }

  /**
   * @inheritDoc
   */
  onDrag(e, dragInfo) {
    if (!this.dragging) {
      return false;
    }

    e.stopImmediatePropagation();

    var pos = this.calcPos(e);
    var rowHeight = this.grid.getOptions()['rowHeight'];
    var rowWidth = 15;
    var currentIndex = pos / rowHeight;
    var currentIndexFloor = Math.floor(currentIndex) || 1;
    var loc = currentIndex % currentIndexFloor;
    var gridLength = /** @type {number} */ (this.grid.getDataLength());
    dragInfo['rect'].css('top', pos - 5);

    // get move index
    var insertBefore = Math.max(0, Math.min(Math.round(currentIndex), gridLength));

    // Re-init the move mode
    this.moveMode = SlickTreeNode.MOVE_MODE.SIBLING;

    // Make sure the rows are in order
    dragInfo['rows'].sort(SlickGridCtrl.rowSort);

    // Are we in the middle of a row?
    if (currentIndex < gridLength && loc > .4 && loc < .6) {
      this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT;
      var insertOn = Math.floor(currentIndex);
      if (this.canDragMove(/** @type {Array.<number>} */ (dragInfo['rows']), insertOn)) {
        var targetNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(insertOn));
        dragInfo['guide'].css('top', (insertBefore + (Math.round(loc) == 0 ? .5 : -.5)) * rowHeight);
        dragInfo['guide'].css('left', (targetNode.getDepth() + 1) * rowWidth);
        dragInfo['rect'].removeClass('bg-danger');
        dragInfo['rect'].addClass('bg-primary');
        dragInfo['canMove'] = true;
      } else {
        dragInfo['guide'].css('top', -1000);
        dragInfo['rect'].removeClass('bg-primary');
        dragInfo['rect'].addClass('bg-danger');
        dragInfo['canMove'] = false;
      }
      dragInfo['insertBefore'] = insertOn;
    } else {
      if (this.canDragMove(/** @type {Array.<number>} */ (dragInfo['rows']), insertBefore)) {
        var targetNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(insertBefore));
        var currentNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(dragInfo['rows'][0]));

        var depth = targetNode ? targetNode.getDepth() : 0;
        dragInfo['guide'].css('top', insertBefore * rowHeight);
        dragInfo['guide'].css('left', (depth + 1) * rowWidth);
        dragInfo['rect'].removeClass('bg-danger');
        dragInfo['rect'].addClass('bg-primary');
        dragInfo['canMove'] = true;

        if (targetNode && targetNode.getParentIndex() != currentNode.getParentIndex()) {
          if (targetNode.getParentIndex() == -1) {
            this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT;
          } else {
            this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT_LOOKUP_PARENT;
          }
        } else if (insertBefore == gridLength) {
          // Moving past the end of a list will reparent to the last element if it can have children
          // If not, make it a sibling
          // var targetNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(insertBefore - 1));
          // if (targetNode.isChildAllowed()) {
          // Reparent to last element's parent
          // insertBefore = insertBefore - 1;
          this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT;
          // }
        }
      } else {
        dragInfo['guide'].css('top', -1000);
        dragInfo['guide'].css('left', 0);
        dragInfo['rect'].removeClass('bg-primary');
        dragInfo['rect'].addClass('bg-danger');
        dragInfo['canMove'] = false;
      }
      dragInfo['insertBefore'] = insertBefore;
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  doMove(rows, insertBefore) {
    // apply the tree filter to get visible data
    var data = this.treeData_ ? this.treeData_.filter(this.treeFilter_.bind(this)) : [];

    // THIN-6398: the below was not working when search was applied and the root only had one child, causing the children
    // to be displayed instead of the root node
    // Controller.getVisibleData_(this.getData(), data);

    var unflatten = [];
    if (this.moveMode == SlickTreeNode.MOVE_MODE.SIBLING) {
      var parent = data[rows[0]].getParent();
      if (!parent) {
        parent = this.root_;
      }
      var children = this.updateSiblings_(data, parent, rows, insertBefore);
      parent.setChildren(children, parent == this.root_ && !this.scope['showRoot']);

      // If the parent was root, we just need its children.
      if (parent == this.root_) {
        if (this.scope['showRoot']) {
          unflatten = this.root_;
        } else {
          unflatten = children;
        }
      } else {
        // Collapse all the data back down
        data.forEach(function(row) {
          if (!row.getParent() || (this.scope['showRoot'] && row === this.root_)) {
            unflatten.push(row);
          }
        }, this);
      }
    } else {
      // Track the original insert position to rearrange the children
      var insertBeforeChild = insertBefore;

      // Reparenting. Fix parent / child hiearchy and add / remove from top level list
      if (this.moveMode == SlickTreeNode.MOVE_MODE.REPARENT_LOOKUP_PARENT) {
        var parentToFind = data[insertBefore].getParent();

        // Get the event parent index
        insertBefore = data.findIndex(function(row) {
          return row.getId() == parentToFind.getId();
        });

        // Parent wasn't found in the tree, so use the original
        if (insertBefore < 0) {
          insertBefore = parentToFind;
        }
      }

      this.updateHierarchy_(data, rows, insertBefore);

      // If we are moving a child to the root level, add it to the correct spot in the tree
      if (this.moveMode == SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT) {
        var left = data.slice(0, insertBefore);
        var right = data.slice(insertBefore, data.length);

        var extractedRows = [];
        for (var i = 0, n = rows.length; i < n; i++) {
          extractedRows.push(data[rows[i]]);
        }

        // Remove the old entries for the moved row
        extractedRows.forEach(function(row) {
          remove(left, row);
          remove(right, row);
        });

        data = left.concat(extractedRows.concat(right));
      } else {
        // Make sure it gets put in the right order in the children
        var parent = data[rows[0]].getParent();
        parent.setChildren(this.updateSiblings_(data, parent, rows, insertBeforeChild), false);
      }

      // Collapse all the data back down
      data.forEach(function(row) {
        if (!row.getParent() || (this.scope['showRoot'] && row === this.root_)) {
          unflatten.push(row);
        }
      }, this);
    }

    this.scope['data'] = unflatten;
    apply(this.scope); // a digest needs to happen before invalidate, see THIN-7252
    this.invalidateRows();
    this.scope.$emit('slicktree.update', this.scope['data']);
  }

  /**
   * Converts an actual tree to a slick tree
   *
   * @param {Array} arr The array of items
   * @param {Array} result The resulting flat array
   * @param {number=} opt_depth The depth
   * @private
   */
  static flatten_(arr, result, opt_depth) {
    if (!opt_depth) {
      opt_depth = 0;
    }

    if (arr) {
      var parent = result.length - 1;
      for (var i = 0, n = arr.length; i < n; i++) {
        var item = /** @type {SlickTreeNode} */ (arr[i]);

        item['id'] = item['id'] || Controller.flattenId_++;
        item.depth = opt_depth;
        item.parentIndex = opt_depth > 0 ? parent : -1;
        result.push(item);

        if (item.getChildren()) {
          Controller.flatten_(item.getChildren(), result, opt_depth + 1);
        }
      }
    }
  }

  /**
   * Return the list of visible nodes. This is needed because slickgrid returns relative row numbers for whats visible
   *
   * @param {Array} arr The array of items
   * @param {Array} result The resulting flat array
   * @private
   */
  static getVisibleData_(arr, result) {
    if (arr) {
      for (var i = 0, n = arr.length; i < n; i++) {
        var item = /** @type {SlickTreeNode} */ (arr[i]);
        result.push(item);
        if (!item.collapsed && item.getChildren()) {
          Controller.getVisibleData_(item.getChildren(), result);
        }
      }
    }
  }
}


/**
 * @type {number}
 * @private
 */
Controller.flattenId_ = 0;
