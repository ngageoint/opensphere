goog.provide('os.data.LayerTreeSearch');
goog.require('os.data.DataManager');
goog.require('os.data.LayerNode');
goog.require('os.data.groupby.LayerZOrderGroupBy');
goog.require('os.layer.ILayer');
goog.require('os.layer.LayerGroup');
goog.require('os.structs.ITreeNodeSupplier');
goog.require('os.ui.data.BaseProvider');
goog.require('os.ui.slick.AbstractGroupByTreeSearch');
goog.require('os.ui.slick.TreeSearch');



/**
 * Extends AbstractGroupByTreeSearch to search through layers on the map
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

  node.setCheckboxVisible(true);
  return node;
};


/**
 * Overridden for post result processing
 * @param {os.data.groupby.INodeGroupBy} groupBy
 * @param {!Array} results
 * @override
 */
os.data.LayerTreeSearch.prototype.finalizeSearch = function(groupBy, results) {
  if (!(groupBy instanceof os.data.groupby.LayerZOrderGroupBy)) {
    var i = results.length;
    while (i--) {
      this.makeGroups_(results[i].getChildren(), /** @type {!os.ui.slick.SlickTreeNode} */ (results[i]));
    }
  }
};


/**
 * @inheritDoc
 */
os.data.LayerTreeSearch.prototype.setSort = function(list) {
  if (this.getGroupBy()) {
    list.sort(os.ui.slick.TreeSearch.idCompare);
  } else {
    list.sort(os.ui.slick.TreeSearch.labelCompare);
  }
};


/**
 * Overridden to fill the list from the map
 * @override
 */
os.data.LayerTreeSearch.prototype.fillListFromSearch = function(list) {
  var map = os.MapContainer.getInstance();
  var l = map.getLayers();

  if (l && l.length > 0) {
    for (var i = 0, n = l.length; i < n; i++) {
      var node = new os.data.LayerNode();
      node.setLayer(/** @type {!os.layer.ILayer} */ (l[i]));
      list.push(node);
    }
  } else {
    this.addNoResult(list);
  }
};


/**
 * Creates groupings from layer id which have the same prefix: <providerId>#<sourceId>#
 * @param {?Array<!os.structs.ITreeNode>} results
 * @param {!os.ui.slick.SlickTreeNode} parent
 * @private
 */
os.data.LayerTreeSearch.prototype.makeGroups_ = function(results, parent) {
  if (results && results.length > 1) {
    var idBuckets = /** @type {!Object<string, !Array<!os.structs.ITreeNode>>} */
        (goog.array.bucket(results, os.data.LayerTreeSearch.getNodeGroup_));
    results.length = 0;

    for (var id in idBuckets) {
      var bucket = idBuckets[id];

      if (bucket.length > 1) {
        var min = Number.MAX_VALUE;

        var title = 'Unknown';

        // pick the shortest title as the label for the group
        for (var i = 0, n = bucket.length; i < n; i++) {
          var t = bucket[i].getLabel() || '';

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
    // Essentially this takes the "(1)" or "(1 of 2)" portion and applies the difference in count
    // to both numbers.
    var label = parent.getLabel();
    i = label.indexOf('(');

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
        var ratio = results.length / counts[0];
      }

      counts[i] *= ratio;
    }

    parent.setLabel(label + '(' + counts[0] + (counts.length > 1 ? ' of ' + counts[1] : '') + ')');
  }
};


/**
 * @param {!os.structs.ITreeNode} node
 * @param {number} index
 * @param {!IArrayLike<!os.structs.ITreeNode>} array
 * @return {string}
 * @private
 */
os.data.LayerTreeSearch.getNodeGroup_ = function(node, index, array) {
  var id = node.getId().split(os.ui.data.BaseProvider.ID_DELIMITER);
  id.pop();

  return id.length > 1 ? id.join(os.ui.data.BaseProvider.ID_DELIMITER) : node.getId();
};
