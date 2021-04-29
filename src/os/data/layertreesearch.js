goog.provide('os.data.LayerTreeSearch');

goog.require('os.data.FolderNode');
goog.require('os.data.LayerNode');
goog.require('os.data.groupby.LayerZOrderGroupBy');
goog.require('os.layer.FolderManager');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerGroup');
goog.require('os.structs.ITreeNodeSupplier');
goog.require('os.ui.data.BaseProvider');
goog.require('os.ui.node.FolderNodeUI');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');
goog.require('os.ui.slick.SlickTreeNode');
goog.require('os.ui.slick.TreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through layers on the map
 *
 * @extends {os.ui.slick.AbstractGroupByTreeSearch}
 * @param {!string} setAs The field to set on...
 * @param {Object} onObj this object
 * @param {string=} opt_noResultLabel The label to use when there are no results
 * @constructor
 */
os.data.LayerTreeSearch = function(setAs, onObj, opt_noResultLabel) {
  os.data.LayerTreeSearch.base(this, 'constructor', [], setAs, onObj, opt_noResultLabel);
};
goog.inherits(os.data.LayerTreeSearch, os.ui.slick.AbstractGroupByTreeSearch);


/**
 * Overridden in inheriting class
 *
 * @return {!Array}
 * @override
 */
os.data.LayerTreeSearch.prototype.getSearchItems = function() {
  // filter out layers that shouldn't be shown by the tree search
  var layers = os.MapContainer.getInstance().getLayers().filter(function(layer) {
    layer = /** @type {os.layer.ILayer} */ (layer);
    return !layer.getHidden();
  });
  return layers;
};


/**
 * Overridden in inheriting class
 *
 * @param {Object} item - search item to setup as a node
 * @return {!os.structs.ITreeNode}
 * @override
 */
os.data.LayerTreeSearch.prototype.setupNode = function(item) {
  var layer = /** @type {!os.layer.ILayer} */ (item);
  var node;

  if (layer.getTreeNode) {
    node = /** @type {!os.structs.ITreeNodeSupplier} */ (layer).getTreeNode();
  } else {
    // not supported - create a normal layer node
    node = new os.data.LayerNode();
    node.setLayer(layer);
  }

  return node;
};


/**
 * Overridden for post result processing
 *
 * @param {os.data.groupby.INodeGroupBy} groupBy
 * @param {!Array} results
 * @override
 */
os.data.LayerTreeSearch.prototype.finalizeSearch = function(groupBy, results) {
  if (groupBy) {
    var i = results.length;
    while (i--) {
      this.makeGroups_(results[i].getChildren(), /** @type {!os.ui.slick.SlickTreeNode} */ (results[i]));
    }
  } else {
    var layerNodes = results.slice();
    results.length = 0;
    this.createResults(results, layerNodes);
  }
};


/**
 * @inheritDoc
 */
os.data.LayerTreeSearch.prototype.setSort = function(list) {
  if (this.getGroupBy()) {
    list.sort(os.ui.slick.TreeSearch.idCompare);
  }
};


/**
 * Overridden to fill the list from the map
 *
 * @override
 */
os.data.LayerTreeSearch.prototype.fillListFromSearch = function(list) {
  var map = os.MapContainer.getInstance();
  var layers = map.getLayers();

  if (layers && layers.length > 0) {
    const layerNodes = [];
    for (var i = 0, n = layers.length; i < n; i++) {
      var layer = /** @type {!os.layer.ILayer} */ (layers[i]);
      var node;

      if (layer.getTreeNode) {
        node = /** @type {!os.structs.ITreeNodeSupplier} */ (layer).getTreeNode();
      } else {
        node = new os.data.LayerNode();
        node.setLayer(layer);
      }

      layerNodes.push(node);
    }

    this.createResults(list, layerNodes);
  } else {
    this.addNoResult(list);
  }
};


/**
 * Creates groupings from layer id which have the same prefix: <providerId>#<sourceId>#
 *
 * @param {?Array<!os.structs.ITreeNode>} results
 * @param {!os.ui.slick.SlickTreeNode} parent
 * @private
 */
os.data.LayerTreeSearch.prototype.makeGroups_ = function(results, parent) {
  if (results && results.length > 0) {
    // if there are no user-created folders, fall back to grouping them automatically
    var idBuckets = /** @type {!Object<string, !Array<!os.structs.ITreeNode>>} */
        (goog.array.bucket(results, this.getNodeGroup.bind(this)));
    results.length = 0;

    for (var id in idBuckets) {
      var bucket = idBuckets[id];

      if (bucket.length > 1) {
        var min = Number.MAX_VALUE;
        var title = 'Unknown';

        // pick the shortest title as the label for the group
        for (var i = 0, n = bucket.length; i < n; i++) {
          var node = /** @type {os.data.LayerNode} */ (bucket[i]);
          var layer = node.getLayer();
          var t = os.implements(layer, os.IGroupable.ID) ?
            /** @type {os.IGroupable} */ (layer).getGroupLabel() : layer.getTitle();

          if (t.length < min) {
            title = t;
            min = t.length;
          }
        }

        var groupLayer = new os.layer.LayerGroup();
        groupLayer.setId(id + os.ui.data.BaseProvider.ID_DELIMITER + '_group');
        groupLayer.setTitle(title);

        var groupNode = new os.data.LayerNode();

        for (i = 0, n = bucket.length; i < n; i++) {
          var node = bucket[i];
          if (node) {
            var layer = node.getLayer();
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
};


/**
 * Creates the final results.
 *
 * @param {!Array<!os.structs.ITreeNode>} results
 * @param {!Array<!os.structs.ITreeNode>} layerNodes
 * @private
 */
os.data.LayerTreeSearch.prototype.createResults = function(results, layerNodes) {
  const items = os.layer.FolderManager.getInstance().getItems();
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
        const folderNode = new os.data.FolderNode(options);
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
    results.sort(os.ui.slick.TreeSearch.labelCompare);
  }
};


/**
 * @param {!os.structs.ITreeNode} node
 * @param {number} index
 * @param {!IArrayLike<!os.structs.ITreeNode>} array
 * @return {string}
 * @protected
 */
os.data.LayerTreeSearch.prototype.getNodeGroup = function(node, index, array) {
  var groupId = node.getId();
  var id;

  if (node instanceof os.data.LayerNode) {
    var layer = node.getLayer();

    if (os.implements(layer, os.IGroupable.ID)) {
      groupId = /** @type {os.IGroupable} */ (layer).getGroupId();
    }

    if (this.getGroupBy() instanceof os.data.groupby.LayerZOrderGroupBy && groupId == node.getId()) {
      // when in the z-order grouping, only group layers that have a specialized groupId
      // this preserves the old behavior of never grouping anything but layers we want when using z-order
      return groupId;
    }

    id = String(groupId).split(os.ui.data.BaseProvider.ID_DELIMITER);
    id.pop();
  }

  return id && id.length > 1 ? id.join(os.ui.data.BaseProvider.ID_DELIMITER) : groupId;
};
