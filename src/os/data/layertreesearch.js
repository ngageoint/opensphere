goog.declareModuleId('os.data.LayerTreeSearch');

import IGroupable from '../igroupable.js';
import osImplements from '../implements.js';
import FolderManager from '../layer/foldermanager.js';
import * as osLayer from '../layer/layer.js';
import LayerGroup from '../layer/layergroup.js';
import {getMapContainer} from '../map/mapinstance.js';
import BaseProvider from '../ui/data/baseprovider.js';
import AbstractGroupByTreeSearch from '../ui/slick/abstractgroupbytreesearch.js';
import TreeSearch from '../ui/slick/treesearch.js';
import FolderNode from './foldernode.js';
import LayerZOrderGroupBy from './groupby/layerzordergroupby.js';
import LayerNode from './layernode.js';

const googArray = goog.require('goog.array');

const {default: ILayer} = goog.requireType('os.layer.ILayer');
const {default: INodeGroupBy} = goog.requireType('os.data.groupby.INodeGroupBy');
const {default: ITreeNode} = goog.requireType('os.structs.ITreeNode');
const {default: ITreeNodeSupplier} = goog.requireType('os.structs.ITreeNodeSupplier');
const {default: SlickTreeNode} = goog.requireType('os.ui.slick.SlickTreeNode');


/**
 * Extends AbstractGroupByTreeSearch to search through layers on the map
 */
export default class LayerTreeSearch extends AbstractGroupByTreeSearch {
  /**
   * Constructor.
   * @param {!string} setAs The field to set on...
   * @param {Object} onObj this object
   * @param {string=} opt_noResultLabel The label to use when there are no results
   */
  constructor(setAs, onObj, opt_noResultLabel) {
    super([], setAs, onObj, opt_noResultLabel);
  }

  /**
   * Overridden in inheriting class
   *
   * @return {!Array}
   * @override
   */
  getSearchItems() {
    // filter out layers that shouldn't be shown by the tree search
    var layers = getMapContainer().getLayers().filter(osLayer.isShown);
    return layers;
  }

  /**
   * Overridden in inheriting class
   *
   * @param {Object} item - search item to setup as a node
   * @return {!ITreeNode}
   * @override
   */
  setupNode(item) {
    var layer = /** @type {!ILayer} */ (item);
    var node;

    if (typeof /** @type {!ITreeNodeSupplier} */ (layer).getTreeNode === 'function') {
      node = /** @type {!ITreeNodeSupplier} */ (layer).getTreeNode();
    } else {
      // not supported - create a normal layer node
      node = new LayerNode();
      node.setLayer(layer);
    }

    return node;
  }

  /**
   * Overridden for post result processing
   *
   * @param {INodeGroupBy} groupBy
   * @param {!Array} results
   * @override
   */
  finalizeSearch(groupBy, results) {
    if (groupBy) {
      var i = results.length;
      while (i--) {
        this.makeGroups_(results[i].getChildren(), /** @type {!SlickTreeNode} */ (results[i]));
      }
    } else {
      var layerNodes = results.slice();
      results.length = 0;
      this.createResults(results, layerNodes);
    }
  }

  /**
   * @inheritDoc
   */
  setSort(list) {
    if (this.getGroupBy()) {
      list.sort(TreeSearch.idCompare);
    }
  }

  /**
   * Overridden to fill the list from the map
   *
   * @override
   */
  fillListFromSearch(list) {
    var map = getMapContainer();
    var layers = map.getLayers().filter(osLayer.isShown);

    if (layers && layers.length > 0) {
      const layerNodes = [];
      for (var i = 0, n = layers.length; i < n; i++) {
        var layer = /** @type {!ILayer} */ (layers[i]);
        var node;

        if (layer.getTreeNode) {
          node = /** @type {!ITreeNodeSupplier} */ (layer).getTreeNode();
        } else {
          node = new LayerNode();
          node.setLayer(layer);
        }

        layerNodes.push(node);
      }

      this.createResults(list, layerNodes);
    } else {
      this.addNoResult(list);
    }
  }

  /**
   * Creates groupings from layer id which have the same prefix: <providerId>#<sourceId>#
   *
   * @param {?Array<!ITreeNode>} results
   * @param {!SlickTreeNode} parent
   * @private
   */
  makeGroups_(results, parent) {
    if (results && results.length > 0) {
      // if there are no user-created folders, fall back to grouping them automatically
      var idBuckets = /** @type {!Object<string, !Array<!ITreeNode>>} */
          (googArray.bucket(results, this.getNodeGroup.bind(this)));
      results.length = 0;

      for (var id in idBuckets) {
        var bucket = idBuckets[id];

        if (bucket.length > 1) {
          var min = Number.MAX_VALUE;
          var title = 'Unknown';

          // pick the shortest title as the label for the group
          for (var i = 0, n = bucket.length; i < n; i++) {
            var node = /** @type {LayerNode} */ (bucket[i]);
            var layer = node.getLayer();
            var t = osImplements(layer, IGroupable.ID) ?
              /** @type {IGroupable} */ (layer).getGroupLabel() : layer.getTitle();

            if (t.length < min) {
              title = t;
              min = t.length;
            }
          }

          var groupLayer = new LayerGroup();
          groupLayer.setId(id + BaseProvider.ID_DELIMITER + '_group');
          groupLayer.setTitle(title);

          var groupNode = new LayerNode();

          for (i = 0, n = bucket.length; i < n; i++) {
            var node = bucket[i];
            if (node) {
              var layer = /** @type {LayerNode} */ (node).getLayer();
              if (layer) {
                groupLayer.addLayer(layer);
              }

              groupNode.addChild(node);
            }
          }

          groupNode.setLayer(groupLayer);
          results.push(groupNode);
        } else if (bucket.length == 1) {
          results.push(bucket[0]);
        }
      }

      // Update the parent count
      // Essentially this takes the "(1)" or "(1 of 2)" portion and applies the difference in count to both numbers.
      var label = parent.getLabel();
      var i = label.indexOf('(');
      var count = results.length;

      /**
       * @type {Array<string|number>}
       */
      var counts = label.substring(i).split(/[^0-9]+/);
      label = label.substring(0, i);

      i = counts.length;
      while (i--) {
        if (counts[i] === '') {
          counts.splice(i, 1);
        }
      }

      for (i = 0; i < counts.length; i++) {
        counts[i] = parseInt(counts[i], 10);

        if (i === 0) {
          var ratio = count / counts[0];
        }

        counts[i] *= ratio;
      }

      parent.setLabel(label + '(' + counts[0] + (counts.length > 1 ? ' of ' + counts[1] : '') + ')');
    }
  }

  /**
   * Creates the final results.
   *
   * @param {!Array<!ITreeNode>} results
   * @param {!Array<!ITreeNode>} layerNodes
   * @private
   */
  createResults(results, layerNodes) {
    const items = FolderManager.getInstance().getItems();
    const folderNodeMap = {};

    if (items.length > 0) {
      /**
       * Recursively build the tree from the folder options saved in FolderManager.
       * @param {osx.layer.FolderOptions} options
       * @param {number} i
       * @param {Array<(osx.layer.FolderOptions|string)>} arr
       */
      var builder = (options, i, arr) => {
        if (options.type == 'folder') {
          const folderNode = new FolderNode(options);
          folderNodeMap[options.id] = folderNode;

          if (folderNodeMap[options.parentId]) {
            folderNodeMap[options.parentId].addChild(folderNode);
          } else {
            results.push(folderNode);
          }

          if (options.children) {
            options.children.forEach(builder);
          }
        } else {
          var layerNode = layerNodes.find((node) => node.getId() === options.id);
          if (layerNode) {
            if (folderNodeMap[options.parentId]) {
              folderNodeMap[options.parentId].addChild(layerNode);
            } else {
              results.push(layerNode);
            }
          }
        }
      };

      items.forEach(builder);
    } else {
      // just use all of the layer nodes
      results.splice(0, 0, ...layerNodes);
      results.sort(TreeSearch.labelCompare);
    }
  }

  /**
   * @param {!ITreeNode} node
   * @param {number} index
   * @param {!IArrayLike<!ITreeNode>} array
   * @return {string}
   * @protected
   */
  getNodeGroup(node, index, array) {
    var groupId = node.getId();
    var id;

    if (node instanceof LayerNode) {
      var layer = node.getLayer();

      if (osImplements(layer, IGroupable.ID)) {
        groupId = /** @type {IGroupable} */ (layer).getGroupId();
      }

      if (this.getGroupBy() instanceof LayerZOrderGroupBy && groupId == node.getId()) {
        // when in the z-order grouping, only group layers that have a specialized groupId
        // this preserves the old behavior of never grouping anything but layers we want when using z-order
        return groupId;
      }

      id = String(groupId).split(BaseProvider.ID_DELIMITER);
      id.pop();
    }

    return id && id.length > 1 ? id.join(BaseProvider.ID_DELIMITER) : groupId;
  }
}
