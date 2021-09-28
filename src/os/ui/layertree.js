goog.declareModuleId('os.ui.LayerTreeUI');

import FolderNode from '../data/foldernode.js';
import LayerNode from '../data/layernode.js';
import ZOrder from '../data/zorder.js';
import FolderManager from '../layer/foldermanager.js';
import {mapLayersToIds} from '../layer/layer.js';
import LayerGroup from '../layer/layergroup.js';
import Module from './module.js';
import {Controller as SlickTreeCtrl, directive as slickTreeDirective} from './slick/slicktree.js';
import SlickTreeNode from './slick/slicktreenode.js';

const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');


/**
 * The layer tree directive.
 *
 * @return {angular.Directive}
 */
export const directive = () => {
  var dir = slickTreeDirective();
  dir.controller = Controller;
  dir.scope['groupBy'] = '=';
  dir.scope['groupByEnabled'] = '=';
  return dir;
};

/**
 * The element tag for the directive.
 * @type {string}
 */
export const directiveTag = 'layertree';

/**
 * Add the directive to the ui module
 */
Module.directive(directiveTag, [directive]);

/**
 * Controller for layers tree
 * @unrestricted
 */
export class Controller extends SlickTreeCtrl {
  /**
   * Constructor.
   * @param {!angular.Scope} $scope
   * @param {!angular.JQLite} $element
   * @param {!angular.$compile} $compile
   * @ngInject
   */
  constructor($scope, $element, $compile) {
    $scope['dragEnabled'] = true;
    super($scope, $element, $compile);
  }

  /**
   * @inheritDoc
   */
  canDragRows(rows) {
    var firstNode = /** @type {SlickTreeNode} */ (this.grid.getDataItem(rows[0]));

    // Must have a node to drag
    if (!firstNode) {
      return false;
    }

    // Only allow dragging past depth 1 if the node supports it
    var isLayerNode = firstNode instanceof LayerNode || firstNode instanceof FolderNode;
    if (!isLayerNode && !firstNode.supportsInternalDrag()) {
      return false;
    }

    // Only allow depth 0 for layer nodes
    var depth = firstNode.depth;
    if (depth === 0 && !isLayerNode) {
      return false;
    }

    for (var i = 1, n = rows.length; i < n; i++) {
      var node = /** @type {SlickTreeNode} */ (this.grid.getDataItem(rows[i]));

      // Don't allow dragging layer nodes and non-layer nodes
      if (node instanceof LayerNode != isLayerNode) {
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
  }

  /**
   * @inheritDoc
   */
  canDragMove(rows, insertBefore) {
    var beforeItem;
    if (isNaN(insertBefore)) {
      return false;
    }

    var nodeToMove = /** @type {SlickTreeNode} */ (this.dataView.getItem(rows[0]));
    if (!nodeToMove) {
      return false;
    }

    var hasFolderOrLayer = rows.some((row) => {
      var node = /** @type {SlickTreeNode} */ (this.dataView.getItem(row));
      return node instanceof FolderNode || node instanceof LayerNode;
    });

    if (hasFolderOrLayer) {
      // Layer Node Drag Rules:
      // 1. Layers can only remain within their z-order group.
      // 2. Layers can be reparented to valid folders.
      // 3. Folders cannot be their own parents.

      // start by updating the moveMode, this is normally done in the parent class AFTER this function is called,
      // but we need to do it first
      var targetNode = /** @type {SlickTreeNode} */ (this.dataView.getItem(insertBefore));

      // iterate up the tree to ensure we're dropping onto another layer or a folder
      while (!targetNode) {
        insertBefore--;

        var candidateNode = /** @type {(LayerNode|FolderNode)} */ (this.grid.getDataItem(insertBefore));
        if (candidateNode) {
          targetNode = !candidateNode.supportsInternalDrag() ? candidateNode : null;
        }
      }

      if (targetNode && targetNode.getParentIndex() != nodeToMove.getParentIndex()) {
        if (targetNode.getParentIndex() == -1) {
          this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT_TO_ROOT;
        } else {
          this.moveMode = SlickTreeNode.MOVE_MODE.REPARENT_LOOKUP_PARENT;
        }
      }

      for (var i = 0, n = rows.length; i < n; i++) {
        // don't allow moving a node directly after itself if it's not a reparent move
        if (this.moveMode == SlickTreeNode.MOVE_MODE.SIBLING && rows[i] == insertBefore) {
          return false;
        }

        var item = /** @type {SlickTreeNode} */ (this.grid.getDataItem(rows[i]));
        beforeItem = /** @type {SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

        if (item instanceof FolderNode) {
          // check if this action would reparent the folder to itself (circular parentages aren't allowed)
          var value = false;

          /**
           * Tests if an item is being moved to a place where it would be its own parent, which is not allowed.
           * @param {ITreeNode} node
           */
          var isSelfParent = (node) => {
            value = item === node;
            if (!value) {
              var parent = node.getParent();
              if (parent) {
                isSelfParent(parent);
              }
            }
          };

          if (beforeItem) {
            isSelfParent(beforeItem);
          }

          return !value;
        }

        if (this.scope['groupBy'] && this.scope['groupByEnabled']) {
          // layers cannot be dragged to a different Z-Order group
          var z = ZOrder.getInstance();
          var differentZ = z.getZType(item.getId()) !== z.getZType(beforeItem.getId());
          if (differentZ) {
            return false;
          }
        } else {
          // we are only working with folders
          return !!targetNode && !targetNode.supportsInternalDrag();
        }
      }
    } else {
      // the item must support internal drag and meet the default tree drag criteria
      if (!nodeToMove.supportsInternalDrag() || !super.canDragMove(rows, insertBefore)) {
        return false;
      }

      beforeItem = /** @type {SlickTreeNode} */ (this.grid.getDataItem(insertBefore));

      // source/target must share the same root node
      if (!beforeItem || beforeItem.getRoot() != nodeToMove.getRoot()) {
        return false;
      }

      return nodeToMove.canDropInternal(beforeItem, this.moveMode);
    }

    return true;
  }

  /**
   * @inheritDoc
   */
  doMove(rows, insertBefore) {
    if (isNaN(insertBefore)) {
      return;
    }

    var nodeToMove = /** @type {SlickTreeNode} */ (this.dataView.getItem(rows[0]));
    if (!nodeToMove) {
      return;
    }

    if (nodeToMove instanceof LayerNode || nodeToMove instanceof FolderNode) {
      var fm = FolderManager.getInstance();
      var z = ZOrder.getInstance();
      var after = false;
      var targetNode = /** @type {(LayerNode|FolderNode)} */ (this.grid.getDataItem(insertBefore));

      // iterate up the tree to ensure we're dropping onto another layer or a folder
      while (!targetNode) {
        after = true;
        insertBefore--;

        var candidateNode = /** @type {(LayerNode|FolderNode)} */ (this.grid.getDataItem(insertBefore));
        if (candidateNode) {
          targetNode = !candidateNode.supportsInternalDrag() ? candidateNode : null;
        }
      }

      if (targetNode) {
        var layer = targetNode instanceof LayerNode ? targetNode.getLayer() : null;
        var targetIds = [];

        if (targetNode instanceof LayerNode) {
          targetIds = [layer.getId()];
        } else if (targetNode instanceof FolderNode) {
          targetIds = [targetNode.getId()];
        }

        if (layer instanceof LayerGroup) {
          // use all of the IDs in the group for the target IDs
          targetIds = /** @type {LayerGroup} */ (layer).getLayers().map(mapLayersToIds);
        }

        for (var i = 0, n = rows.length; i < n; i++) {
          var moveNode = /** @type {(LayerNode|FolderNode)} */ (this.grid.getDataItem(rows[i]));

          if (moveNode) {
            layer = moveNode instanceof LayerNode ? moveNode.getLayer() : null;
            var moveIds = [];

            if (moveNode instanceof LayerNode) {
              moveIds = [layer.getId()];
            } else if (moveNode instanceof FolderNode) {
              moveIds = [moveNode.getId()];
            }

            if (layer instanceof LayerGroup) {
              // move all the layer group's children in the z-order
              moveIds = /** @type {LayerGroup} */ (layer).getLayers().map(mapLayersToIds);
            }

            if (!after) {
              // dropping directly on top of a node should put the result after if its moving down the tree
              after = this.moveMode == SlickTreeNode.MOVE_MODE.REPARENT && insertBefore >= rows[i];
            }

            for (var j = 0, m = moveIds.length; j < m; j++) {
              for (var k = 0, l = targetIds.length; k < l; k++) {
                if (this.scope['groupBy'] && this.scope['groupByEnabled']) {
                  // use !after since the tree is sorted by descending z-index
                  z.move(moveIds[j], targetIds[k], !after);
                } else {
                  // This covers the case of dropping a layer into the space above a folder. This case is nasty
                  // because the target ID is the folder in both cases, so we need to know if we're making it a child
                  // to that folder or a sibling to that folder
                  const sibling = this.moveMode != SlickTreeNode.MOVE_MODE.REPARENT;

                  // update the folder manager
                  fm.move(moveIds[j], targetIds[k], after, sibling);
                  fm.persist();
                }
              }
            }
          }
        }

        z.update();
        z.save();
      }
    } else if (nodeToMove.supportsInternalDrag()) {
      // use default tree drag behavior
      super.doMove(rows, insertBefore);
    }

    // update the UI
    this.scope.$emit('search');
  }
}
