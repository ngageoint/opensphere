goog.provide('os.ui.LayerTreeCtrl');
goog.provide('os.ui.layerTreeDirective');

goog.require('os.data.LayerNode');
goog.require('os.data.ZOrder');
goog.require('os.layer');
goog.require('os.layer.LayerGroup');
goog.require('os.ui.Module');
goog.require('os.ui.slick.SlickTreeCtrl');
goog.require('os.ui.slick.slickTreeDirective');


/**
 * The layer tree directive.
 * @return {angular.Directive}
 */
os.ui.layerTreeDirective = function() {
  var dir = os.ui.slick.slickTreeDirective();
  dir['controller'] = os.ui.LayerTreeCtrl;
  return dir;
};


/**
 * Add the directive to the ui module
 */
os.ui.Module.directive('layertree', [os.ui.layerTreeDirective]);



/**
 * Controller for layers tree
 * @param {!angular.Scope} $scope
 * @param {!angular.JQLite} $element
 * @param {!angular.$compile} $compile
 * @extends {os.ui.slick.SlickTreeCtrl}
 * @constructor
 * @ngInject
 */
os.ui.LayerTreeCtrl = function($scope, $element, $compile) {
  $scope['dragEnabled'] = true;
  os.ui.LayerTreeCtrl.base(this, 'constructor', $scope, $element, $compile);
};
goog.inherits(os.ui.LayerTreeCtrl, os.ui.slick.SlickTreeCtrl);


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.canDragRows = function(rows) {
  var firstNode = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[0]));

  // Must have a node to drag
  if (!firstNode) {
    return false;
  }

  // Only allow dragging past depth 1 if the node supports it
  var isLayerNode = firstNode instanceof os.data.LayerNode;
  if (!isLayerNode && !firstNode.supportsInternalDrag()) {
    return false;
  }

  // Only allow depth 0 for layer nodes
  var depth = firstNode.depth;
  if (depth === 0 && !isLayerNode) {
    return false;
  }

  for (var i = 1, n = rows.length; i < n; i++) {
    var node = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[i]));

    // Don't allow dragging layer nodes and non-layer nodes
    if (node instanceof os.data.LayerNode != isLayerNode) {
      return false;
    }

    // Don't allow moving depths different than the first row.
    if (node.depth != depth) {
      return false;
    }

    // If not dragging layer nodes, make sure dragging is supported by the nodes.
    if (!isLayerNode && !node.supportsInternalDrag()) {
      return false;
    }
  }

  // All good, proceed
  return true;
};


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.canDragMove = function(rows, insertBefore) {
  var beforeItem;
  if (isNaN(insertBefore)) {
    return false;
  }

  var firstRow = /** @type {os.ui.slick.SlickTreeNode} */ (this.dataView.getItem(rows[0]));
  if (!firstRow) {
    return false;
  }

  if (firstRow instanceof os.data.LayerNode) {
    // Layer Node Drag Rules:
    // 1. Only same depth can be dragged
    // 2. Cannot be dragged to new parent
    // 3. Cannot be dragged to a different Z-Order group

    for (var i = 0, n = rows.length; i < n; i++) {
      // no point in moving before or after itself
      if (rows[i] == insertBefore || rows[i] == insertBefore - 1) {
        return false;
      }

      var item = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(rows[i]));

      // rule 1: only same depth can be dragged
      if (item.depth < firstRow.depth) {
        return false;
      }

      beforeItem = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

      // if there isn't a target item or it has a different depth, go back and find the last item in the tree with the
      // same depth
      if (!beforeItem || beforeItem.depth !== firstRow.depth) {
        var j = insertBefore;
        while (j >= 0 && (!beforeItem || beforeItem.depth !== firstRow.depth)) {
          j--;
          beforeItem = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(j));
        }
      }

      // rule 2: cannot be dragged outside of parent
      if (!beforeItem || beforeItem.parentIndex !== item.parentIndex) {
        return false;
      }

      // rule 3: cannot be dragged to a different Z-Order group
      var z = os.data.ZOrder.getInstance();
      if (z.getZType(item.getId()) !== z.getZType(beforeItem.getId())) {
        return false;
      }
    }
  } else {
    // the item must support internal drag and meet the default tree drag criteria
    if (!firstRow.supportsInternalDrag() || !os.ui.LayerTreeCtrl.base(this, 'canDragMove', rows, insertBefore)) {
      return false;
    }

    beforeItem = /** @type {os.ui.slick.SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

    // source/target must share the same root node
    if (!beforeItem || beforeItem.getRoot() != firstRow.getRoot()) {
      return false;
    }

    return firstRow.canDropInternal(beforeItem, this.moveMode);
  }

  return true;
};


/**
 * @inheritDoc
 */
os.ui.LayerTreeCtrl.prototype.doMove = function(rows, insertBefore) {
  if (isNaN(insertBefore)) {
    return;
  }

  var firstRow = /** @type {os.ui.slick.SlickTreeNode} */ (this.dataView.getItem(rows[0]));
  if (!firstRow) {
    return;
  }

  if (firstRow instanceof os.data.LayerNode) {
    var after = false;
    var item = /** @type {os.data.LayerNode} */ (this.grid.getDataItem(insertBefore));

    while (!(item instanceof os.data.LayerNode) || item.depth !== firstRow.depth) {
      after = true;
      insertBefore--;
      item = /** @type {os.data.LayerNode} */ (this.grid.getDataItem(insertBefore));
    }

    if (item) {
      var layer = item.getLayer();
      var ids = [layer.getId()];
      var z = os.data.ZOrder.getInstance();

      if (layer instanceof os.layer.LayerGroup) {
        ids = /** @type {os.layer.LayerGroup} */ (layer).getLayers().map(os.layer.mapLayersToIds);
      }

      for (var i = 0, n = rows.length; i < n; i++) {
        item = /** @type {os.data.LayerNode} */ (this.grid.getDataItem(rows[i]));

        if (item) {
          layer = item.getLayer();
          var moveIds = [layer.getId()];

          if (layer instanceof os.layer.LayerGroup) {
            moveIds = /** @type {os.layer.LayerGroup} */ (layer).getLayers().map(os.layer.mapLayersToIds);
          }

          for (var j = 0, m = moveIds.length; j < m; j++) {
            for (var k = 0, l = ids.length; k < l; k++) {
              // use !after since the tree is sorted by descending z-index
              z.move(moveIds[j], ids[k], !after);
            }
          }
        }
      }

      z.update();
      z.save();
    }
  } else if (firstRow.supportsInternalDrag()) {
    // use default tree drag behavior
    os.ui.LayerTreeCtrl.base(this, 'doMove', rows, insertBefore);
  }

  // update the UI
  this.scope.$emit('search');
};
